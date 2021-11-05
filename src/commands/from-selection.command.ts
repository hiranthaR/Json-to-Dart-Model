import * as _ from 'lodash';
import * as fs from 'fs';

import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { CodeGenerator, Input, getUserInput } from '../input';
import { Uri, window } from 'vscode';
import { generateClass } from '../index';
import { getSelectedText, handleError, validateJSON } from '../lib';
import { promptForBaseClassName, promptForTargetDirectory } from '../shared/user-prompts';
import { hasObject, runBuildRunner, runDartFormat } from '../utils';

export const transformFromSelection = async (uri: Uri) => {
    const className = await promptForBaseClassName();
    let input = new Input();

    if (_.isNil(className) || className.trim() === '') {
        window.showErrorMessage('The class name must not be empty');
        return;
    }

    if (!input.primaryConfiguration) {
        input = await getUserInput();
    }

    let targetDirectory: String | undefined;

    if (_.isNil(_.get(uri, 'fsPath')) || !fs.lstatSync(uri.fsPath).isDirectory()) {
        targetDirectory = await promptForTargetDirectory();
        if (_.isNil(targetDirectory)) {
            window.showErrorMessage('Please select a valid directory');
            return;
        }
    } else {
        targetDirectory = uri.fsPath;
    }

    const json: string = await getSelectedText().then(validateJSON).catch(handleError);
    const hasObj = hasObject(JSON.parse(json));
    const model = new ClassNameModel(className);
    const config: Settings = {
        model: model,
        targetDirectory: targetDirectory as string,
        json: json,
        input: input,
        targetDirectoryType: hasObj ? TargetDirectoryType.Compressed : TargetDirectoryType.Expanded,
    };

    if (!input.primaryConfiguration) {
        // Disable run builder from the not code generation function.
        config.input.codeGenerator = CodeGenerator.Default;
    }

    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        const formattingTarget = hasObj ? model.directoryName : '';

        runDartFormat(targetDirectory as string, formattingTarget);

        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }

    }).catch(handleError);
};