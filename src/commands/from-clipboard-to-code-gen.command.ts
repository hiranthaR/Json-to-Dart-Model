import * as _ from 'lodash';
import * as fs from 'fs';

import { ClassNameModel, Settings, TargetDirectoryType } from '../settings';
import { Input, getUserInput } from '../input';
import { Uri, window } from 'vscode';
import { generateClass } from '../index';
import { getClipboardText, handleError, validateJSON } from '../lib';
import { promptForBaseClassName, promptForTargetDirectory } from '../shared/user-prompts';
import { runBuildRunner, runDartFormat } from '../utils';

export const transformFromClipboardToCodeGen = async (uri: Uri) => {
    let input = new Input();
    const className = await promptForBaseClassName();

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

    const json: string = await getClipboardText().then(validateJSON).catch(handleError);
    const model = new ClassNameModel(className);
    const config: Settings = {
        model: model,
        targetDirectory: targetDirectory as string,
        json: json,
        input: input,
        targetDirectoryType: TargetDirectoryType.Compressed,
    };
    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        const formattingTarget = model.directoryName;

        runDartFormat(targetDirectory as string, formattingTarget);

        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }

    }).catch(handleError);
};
