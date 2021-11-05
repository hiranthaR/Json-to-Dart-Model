import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { generateClass } from '../index';
import { Input } from '../input';
import { handleError } from '../lib';
import { jsonReader } from '../json-reader';
import { window } from 'vscode';
import { runBuildRunner, runDartFormat } from '../utils';

export const transformFromFile = async () => {
    if (jsonReader.existsSyncFile || jsonReader.existsSyncDir) {
        // All json objects from the tracked places.
        const allData = jsonReader.allData;
        const len = allData.length;
        // User configuration.
        const input = new Input();

        if (len === 0) {
            window.showInformationMessage('Nothing to generate from the tracked places');
            return;
        }

        const fastMode = input.fastMode ?? false;
        const confirm = !fastMode ? await jsonReader.getConfirmation() : fastMode;

        if (confirm) {
            // Start converting.
            for (let i = 0; i < len; i++) {
                const end = i === len - 1;
                const [err, data] = allData[i];

                if (err) {
                    const text = `Failed to read JSON in the file ${data.filePath}. ${err.name}: ${err.message}`;
                    window.showErrorMessage(text);
                    return;
                }

                if (!data.className) {
                    const text = `Some JSON objects do not have class names in the file ${data.filePath}.`;
                    window.showErrorMessage(text);
                    return;
                }

                // Settings config.
                const config: Settings = {
                    model: new ClassNameModel(data.className),
                    targetDirectory: data.targetDirectory,
                    json: data.json,
                    input: input,
                    targetDirectoryType: data.targetDirectoryType,
                };
                // Create new settings.
                const settings = new Settings(config);

                generateClass(settings).catch(handleError);

                if (end) {
                    window.showInformationMessage('Models successfully added');
                }
            }

            // Format directories
            for (let i = 0; i < len; i++) {
                const data = allData[i][1];
                if (data.className) {
                    const model = new ClassNameModel(data.className);
                    const formattingTarget = data.targetDirectoryType === TargetDirectoryType.Compressed ? model.directoryName : '';

                    runDartFormat(data.targetDirectory, formattingTarget);
                }
            }

            if (input.generate && input.runBuilder) {
                runBuildRunner();
            }
        }
    } else {
        await jsonReader.createTrackingLocation();
    }
};