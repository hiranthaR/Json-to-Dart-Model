import * as _ from 'lodash';
import * as fs from 'fs';

import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { CodeGenerator, Input, getUserInput } from '../input';
import { Uri, window } from 'vscode';
import { generateClass, runBuildRunner, runDartFormat } from '../index';
import { getSelectedText, handleError, validateLength } from '../lib';
import { promptForBaseClassName, promptForTargetDirectory } from '../shared/user-prompts';

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

    const json: string = await getSelectedText().then(validateLength).catch(handleError);

    const config: Settings = {
        model: new ClassNameModel(className),
        targetDirectory: <string>targetDirectory,
        object: json,
        input: input,
        targetDirectoryType: TargetDirectoryType.Standard,
    };

    if (!input.primaryConfiguration) {
        // Disable run builder from the not code generation function.
        config.input.codeGenerator = CodeGenerator.Default;
    }

    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        runDartFormat(<string>targetDirectory, 'models');
        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};