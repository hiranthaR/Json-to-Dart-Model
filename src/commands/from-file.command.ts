import { window } from 'vscode';
import { generateClass, runBuildRunner, runDartFormat } from '../index';
import { Input } from '../input';
import { handleError } from '../lib';
import { models } from '../models-file';
import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';

/** Used to warn users about changes. */
const deprecatedSettingsProperties: string[] = [
    'freezed',
    'equatable',
    'immutable',
    'toString',
    'copyWith',
    'equality',
    'serializable',
    'nullSafety',
    'targetDirectory',
    'primaryConfiguration',
    'fastMode',
];

/**
 * Checks if `models.jsonc` file have configuration object which has been moved to the VS Code settings.
 * @param {Object} object that contains the deprecated properties.
 * @returns `true` if contains old settings object keys.
 */
const isDeprecatedSettings = (object: Object): boolean => {
    return Object.keys(object).every((prop) => {
        return deprecatedSettingsProperties.includes(prop);
    });
};

export const transformFromFile = async () => {
    if (models.exist) {
        if (models.getModels()) {
            // All json objects from the models.jsonc.
            const objects: any[] = models.getModels()!;
            // User configuration.
            const input = new Input();

            if (!objects.length) {
                window.showInformationMessage('models.jsonc file is empty');
                return;
            }

            if (isDeprecatedSettings(objects[0])) {
                window.showInformationMessage('Configuration from the file models.jsonc was moved to the Settings/Extensions/JSON To Dart Model. Configure a new option in the settings and remove the configuration item from the file models.jsonc to avoid this warning.');
                return;
            }

            let targetDirectoryType = TargetDirectoryType.Default;
            let targetDirectory = models.directory + input.targetDirectory;
            const duplicates = await models.duplicatesClass(objects);

            if (duplicates.length) {
                for (const name of duplicates) {
                    if (name === undefined) {
                        window.showWarningMessage('Some JSON objects do not have a class name');
                        return;
                    }
                    window.showWarningMessage(`Rename any of the duplicate class ${name} to continue`);
                    return;
                }
            }

            const fastMode = input.fastMode ?? false;
            const confirm = !fastMode ? await models.getConfirmation() : fastMode;

            if (confirm && objects.length) {
                // Start converting.
                for await (const object of objects) {
                    // Class name key.
                    const key = '__className';
                    // Separate class names from objects.
                    const { [key]: className, ['__path']: path, ...jsonObject } = object;
                    // Conver back to json.
                    const json = JSON.stringify(jsonObject);
                    // Check if the class name is not missing.
                    if (className === undefined) {
                        window.showWarningMessage('Some JSON objects do not have a class name');
                        return;
                    }

                    // Toggle target directories by generating multiple models.
                    if (path !== undefined) {
                        // Target directory by user preferences
                        targetDirectory = models.directory + path;
                        targetDirectoryType = TargetDirectoryType.Raw;
                    } else {
                        // Default
                        targetDirectory = models.directory + input.targetDirectory;
                        targetDirectoryType = TargetDirectoryType.Default;
                    }

                    // Settings config.
                    const config: Settings = {
                        model: new ClassNameModel(className),
                        targetDirectory: targetDirectory,
                        object: json,
                        input: input,
                        targetDirectoryType: targetDirectoryType,
                    };
                    // Create new settings.
                    const settings = new Settings(config);

                    await generateClass(settings).catch(handleError);
                }
                window.showInformationMessage('Models successfully added');
                // Format directories
                for await (const object of objects) {
                    // Class name key.
                    const key = '__className';
                    // Separate class names from objects.
                    const { [key]: className } = object;
                    const model = new ClassNameModel(className as string);
                    runDartFormat(targetDirectory, model.className);
                }
                if (input.generate && input.runBuilder) {
                    runBuildRunner();
                }
            }
        }
    } else {
        models.create();
    }
};