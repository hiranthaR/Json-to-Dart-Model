import * as _ from 'lodash';
import * as fs from 'fs';

import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { CodeGenerator, Input, getUserInput } from '../input';
import { Uri, window } from 'vscode';
import { generateClass, runBuildRunner, runDartFormat, } from '../index';
import { getClipboardText, handleError, validateJSON } from '../lib';
import { promptForBaseClassName, promptForTargetDirectory } from '../shared/user-prompts';
import { hasObject } from '../utils';

export const transformFromClipboard = async (uri: Uri) => {
    const className = await promptForBaseClassName();
    let input = new Input();

    if (_.isNil(className) || className.trim() === '') {
        window.showErrorMessage('The class name must not be empty');
        return;
    }

    if (!input.primaryConfiguration) {
        input = await getUserInput();
    }

    let targetDirectory: string | undefined;

    if (_.isNil(_.get(uri, 'fsPath')) || !fs.lstatSync(uri.fsPath).isDirectory()) {
        targetDirectory = await promptForTargetDirectory();
        if (_.isNil(targetDirectory)) {
            window.showErrorMessage('Please select a valid directory');
            return;
        }
    } else {
        targetDirectory = uri.fsPath;
    }

    const json: string = await getClipboardText().then(validateJSON).catch(handleError);
    const hasObj = hasObject(JSON.parse(json));
    const model = new ClassNameModel(className);
    const config: Settings = {
        model: model,
        targetDirectory: <string>targetDirectory,
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

        runDartFormat(<string>targetDirectory, formattingTarget);

        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};