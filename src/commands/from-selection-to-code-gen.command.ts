import * as _ from 'lodash';
import * as fs from 'fs';

import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { Input, getUserInput } from '../input';
import { Uri, window } from 'vscode';
import { generateClass, runBuildRunner, runDartFormat } from '../index';
import { getSelectedText, handleError, validateJSON } from '../lib';
import { promptForBaseClassName, promptForTargetDirectory } from '../shared/user-prompts';

export const transformFromSelectionToCodeGen = async (uri: Uri) => {
    const className = await promptForBaseClassName();
    let input = new Input();

    if (_.isNil(className) || className.trim() === '') {
        window.showErrorMessage('The class name must not be empty');
        return;
    }

    if (!input.primaryConfiguration) {
        input = await getUserInput(true);
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
    const model = new ClassNameModel(className);
    const config: Settings = {
        model: model,
        targetDirectory: <string>targetDirectory,
        json: json,
        input: input,
        targetDirectoryType: TargetDirectoryType.Compressed,
    };
    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        const formattingTarget = model.directoryName;

        runDartFormat(<string>targetDirectory, formattingTarget);

        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};