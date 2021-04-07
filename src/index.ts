import {
  Uri,
  ExtensionContext,
  commands,
  window,
  OpenDialogOptions,
  workspace,
  InputBoxOptions,
} from "vscode";
import {
  handleError,
  getClipboardText,
  getSelectedText,
  validateLength,
  createClass,
  appendPubspecDependencies,
  InputSettings,
} from "./lib";

import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

import cp = require("child_process");
import { getUserInput, Input } from "./input";
import { Models } from "./models_file";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromFile",
      transformFromFile)
  );
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromSelection",
      transformFromSelection)
  );
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromClipboard",
      transformFromClipboard)
  );
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.addCodeGenerationLibraries",
      addCodeGenerationLibraries
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromClipboardToCodeGen",
      transformFromClipboardToCodeGen
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromSelectionToCodeGen",
      transformFromSelectionToCodeGen
    )
  );
}

/**
 * Run "build_runner build".
 */
function runGenerator() {
  let terminal = window.createTerminal("pub get");
  terminal.show();
  terminal.sendText(
    "flutter pub run build_runner build --delete-conflicting-outputs"
  );
}

async function transformFromFile() {
  const jsonc = require('jsonc').safe;
  const runFromFile = true;
  const models = new Models();

  if (models.exist) {
    const data = models.data;
    const [err, result] = jsonc.parse(data);
    if (err) {
      handleError(new Error(`Failed to parse JSON: ${err.message}.\nProbably bad JSON syntax.`));
    } else {
      // All json objects from the models.jsonc.
      const objects: any[] = result;
      // User configuration.
      const input = new Input(objects[0]);
      const isValid = await models.validateSettings(input);

      if (!isValid) {
        return;
      }

      const targetDirectory = models.directory + input.targetDirectory;
      const duplicates = await models.duplicatesClass(objects);

      if (duplicates.length) {
        for (const name of duplicates) {
          if (name === undefined) {
            window.showWarningMessage(`Some json objects do not have a class name`);
            return;
          }
          window.showWarningMessage(`Rename any of the duplicate class ${name} to continue`);
          return;
        }
      }

      const fastMode = objects[0].fastMode ?? false;
      const confirm = !fastMode ? await models.getConfirmation() : fastMode;

      if (confirm && objects.length === 1) {
        window.showInformationMessage('models.jsonc file is empty');
      }

      if (confirm && objects.length > 1) {
        // Start converting.
        for await (const object of objects.slice(1)) {
          // Class name key.
          const key = '__className';
          // Separate class names from objects.
          const { [key]: className, ...jsonObject } = object;
          // Conver back to json.
          const json = JSON.stringify(jsonObject);
          // Set settings.
          const settings = new InputSettings(
            className,
            <string>targetDirectory,
            json,
            input.generate,
            input,
            runFromFile
          );
          generateClass(settings);
        }
        window.showInformationMessage('Models successfully added');
        if (input.generate || input.freezed) {
          runGenerator();
        }
      }
    }
  } else {
    models.create();
  }
}

async function transformFromSelection(uri: Uri) {
  const className = await promptForBaseClassName();
  if (_.isNil(className) || className.trim() === "") {
    window.showErrorMessage("The class name must not be empty");
    return;
  }

  const input = await getUserInput();

  let targetDirectory: String | undefined;
  if (
    _.isNil(_.get(uri, "fsPath")) ||
    !fs.lstatSync(uri.fsPath).isDirectory()
  ) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      window.showErrorMessage("Please select a valid directory");
      return;
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  getSelectedText()
    .then(validateLength)
    .then((json) =>
      generateClass(new InputSettings(className, <string>targetDirectory, json, true, input)))
    .catch(handleError);
}

async function transformFromSelectionToCodeGen(uri: Uri) {
  const className = await promptForBaseClassName();
  if (_.isNil(className) || className.trim() === "") {
    window.showErrorMessage("The class name must not be empty");
    return;
  }

  const input = await getUserInput(true);

  let targetDirectory: String | undefined;
  if (
    _.isNil(_.get(uri, "fsPath")) ||
    !fs.lstatSync(uri.fsPath).isDirectory()
  ) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      window.showErrorMessage("Please select a valid directory");
      return;
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  getSelectedText()
    .then(validateLength)
    .then((json) =>
      generateClass(new InputSettings(className, <string>targetDirectory, json, true, input)))
    .then((_) => runGenerator()).catch(handleError);
}

async function transformFromClipboard(uri: Uri) {
  const className = await promptForBaseClassName();
  if (_.isNil(className) || className.trim() === "") {
    window.showErrorMessage("The class name must not be empty");
    return;
  }

  const input = await getUserInput();

  let targetDirectory: String | undefined;
  if (
    _.isNil(_.get(uri, "fsPath")) ||
    !fs.lstatSync(uri.fsPath).isDirectory()
  ) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      window.showErrorMessage("Please select a valid directory");
      return;
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  getClipboardText()
    .then(validateLength)
    .then((json) =>
      generateClass(new InputSettings(className, <string>targetDirectory, json, true, input)))
    .catch(handleError);
}

async function transformFromClipboardToCodeGen(uri: Uri) {
  const className = await promptForBaseClassName();
  if (_.isNil(className) || className.trim() === "") {
    window.showErrorMessage("The class name must not be empty");
    return;
  }

  const input = await getUserInput(true);

  let targetDirectory: String | undefined;
  if (
    _.isNil(_.get(uri, "fsPath")) ||
    !fs.lstatSync(uri.fsPath).isDirectory()
  ) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      window.showErrorMessage("Please select a valid directory");
      return;
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  getClipboardText()
    .then(validateLength)
    .then((json) =>
      generateClass(new InputSettings(className, <string>targetDirectory, json, true, input)))
    .then((_) => runGenerator()).catch(handleError);
}

function promptForBaseClassName(): Thenable<string | undefined> {
  const classNamePromptOptions: InputBoxOptions = {
    prompt: "Base Class Name",
    placeHolder: "User",
  };
  return window.showInputBox(classNamePromptOptions);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select a folder to create the Models",
    canSelectFolders: true,
    defaultUri: Uri.parse(workspace.rootPath?.replace(/\\/g, "/") + "/lib/"),
  };

  return window.showOpenDialog(options).then((uri) => {
    if (_.isNil(uri) || _.isEmpty(uri)) {
      return workspace.rootPath?.replace(/\\/g, "/") + "/lib/";
    }
    return uri[0].fsPath;
  });
}

async function generateClass(settings: InputSettings) {
  const classDirectoryPath = `${settings.targetDirectory}`;
  if (!fs.existsSync(classDirectoryPath)) {
    await createDirectory(classDirectoryPath);
  }
  await createClass(settings);
}

function createDirectory(targetDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirp(targetDirectory)
      .then((value) => resolve())
      .catch((error) => reject(error));
  });
}

async function addCodeGenerationLibraries() {
  let folderPath = workspace.rootPath;
  const targetPath = `${folderPath}/pubspec.yaml`;

  if (fs.existsSync(targetPath)) {
    appendPubspecDependencies(targetPath)
      .then((_) => window.showInformationMessage("Dependencies added!"))
      .catch(handleError);
  } else {
    window.showErrorMessage("pubspec.yaml does't exist :/");
  }
}
