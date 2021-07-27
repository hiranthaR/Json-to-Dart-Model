import * as _ from "lodash";
import * as fs from "fs";

import { Uri, window } from "vscode";
import { dartFormat, generateClass, getConfiguration, runBuildRunner, } from "../index";
import { getUserInput, Input, promptForBaseClassName, promptForTargetDirectory, } from "../input";
import { getClipboardText, handleError, validateLength } from "../lib";
import { ISettings, PathType, Settings } from "../settings";

export const transformFromClipboard = async (uri: Uri) => {
    const primaryInput = getConfiguration();
    const className = await promptForBaseClassName();
    let pathType: PathType = PathType.Standard;
    let input: Input;

    if (_.isNil(className) || className.trim() === "") {
        window.showErrorMessage("The class name must not be empty");
        return;
    }

    if (primaryInput && primaryInput.primaryConfiguration) {
        input = primaryInput;
    } else {
        input = await getUserInput();
    }

    let targetDirectory: string | undefined;

    if (_.isNil(_.get(uri, "fsPath")) || !fs.lstatSync(uri.fsPath).isDirectory()) {
        targetDirectory = await promptForTargetDirectory();
        if (_.isNil(targetDirectory)) {
            window.showErrorMessage("Please select a valid directory");
            return;
        }
    } else {
        pathType = PathType.Raw;
        targetDirectory = uri.fsPath;
    }

    const json: string = await getClipboardText().then(validateLength).catch(handleError);

    const config: ISettings = {
        className: className,
        targetDirectory: <string>targetDirectory,
        object: json,
        input: input,
        pathType: pathType,
    };
    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        dartFormat(
            <string>targetDirectory,
            settings.pathType === PathType.Raw ? "" : "models"
        );
        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};