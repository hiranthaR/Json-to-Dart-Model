import * as _ from "lodash";
import * as fs from "fs";

import { Uri, window } from "vscode";
import { dartFormat, generateClass, getConfiguration, runBuildRunner } from "../index";
import { getUserInput, Input, promptForBaseClassName, promptForTargetDirectory, } from "../input";
import { getSelectedText, handleError, validateLength } from "../lib";
import { PathType, ISettings, Settings } from "../settings";

export const transformFromSelectionToCodeGen = async (uri: Uri) => {
    const primaryInput = getConfiguration();
    const className = await promptForBaseClassName();
    let input: Input;

    if (_.isNil(className) || className.trim() === "") {
        window.showErrorMessage("The class name must not be empty");
        return;
    }

    if (primaryInput && primaryInput.primaryConfiguration) {
        input = primaryInput;
    } else {
        input = await getUserInput(true);
    }

    let targetDirectory: String | undefined;

    if (_.isNil(_.get(uri, "fsPath")) || !fs.lstatSync(uri.fsPath).isDirectory()) {
        targetDirectory = await promptForTargetDirectory();
        if (_.isNil(targetDirectory)) {
            window.showErrorMessage("Please select a valid directory");
            return;
        }
    } else {
        targetDirectory = uri.fsPath;
    }

    const json: string = await getSelectedText().then(validateLength).catch(handleError);

    const config: ISettings = {
        className: className,
        targetDirectory: <string>targetDirectory,
        object: json,
        input: input,
        pathType: PathType.Standard,
    };
    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        dartFormat(<string>targetDirectory, "models");
        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};