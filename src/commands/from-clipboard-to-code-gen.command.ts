import * as _ from "lodash";
import * as fs from "fs";

import { Uri, window } from "vscode";
import { runDartFormat, generateClass, runBuildRunner } from "../index";
import { getUserInput, Input } from "../input";
import { getClipboardText, handleError, validateLength } from "../lib";
import { PathType, Settings } from "../settings";
import { promptForBaseClassName, promptForTargetDirectory } from "../shared/user-prompts";

export const transformFromClipboardToCodeGen = async (uri: Uri) => {
    let input = new Input();
    const className = await promptForBaseClassName();

    let pathType: PathType = PathType.Standard;

    if (_.isNil(className) || className.trim() === "") {
        window.showErrorMessage("The class name must not be empty");
        return;
    }

    if (!input.primaryConfiguration) {
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
        pathType = PathType.Raw;
        targetDirectory = uri.fsPath;
    }

    const json: string = await getClipboardText().then(validateLength).catch(handleError);

    const config: Settings = {
        className: className,
        targetDirectory: <string>targetDirectory,
        object: json,
        input: input,
        pathType: pathType,
    };
    // Create new settings.
    const settings = new Settings(config);

    await generateClass(settings).then((_) => {
        runDartFormat(<string>targetDirectory, "models");
        if (input.generate && input.runBuilder) {
            runBuildRunner();
        }
    }).catch(handleError);
};
