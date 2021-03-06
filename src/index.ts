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
} from "./lib";

import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

import { getUserInput, Input } from "./input";
import { Models } from "./models_file";
import { Settings } from "./settings";

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
 * Run dart format command to format dart code with formatting that follows Dart guidelines.
 * @param {string} text the destination directory to be formatted.
 * 
 * To format directory test
 * @example
 * ```bash
 * lib test
 * ```
 */
async function dartFormat(directory: string, lastDirectory: string) {
  const startIndex = directory.indexOf("lib/");
  const formatDirectory = directory.substring(startIndex).split("/").join(" ");
  const fileDirectory = formatDirectory + " " + lastDirectory.toLowerCase();
  let terminal = window.createTerminal();
  terminal.sendText("dart format bin " + fileDirectory);
}

/**
 * Run "build_runner build".
 */
function runBuildRunner() {
  let terminal = window.createTerminal("pub get");
  terminal.show();
  terminal.sendText(
    "flutter pub run build_runner build --delete-conflicting-outputs"
  );
}

export function getConfiguration(): Input {
  const config = workspace.getConfiguration('jsonToDart');
  let input = new Input();
  input.freezed = config.get<boolean>('freezed') ?? false;
  input.serializable = config.get<boolean>('serializable') ?? false;
  input.equatable = config.get<boolean>('equatable') ?? false;
  input.immutable = config.get<boolean>('immutable') ?? false;
  input.equality = config.get<boolean>('equality') ?? false;
  input.toString = config.get<boolean>('toString') ?? false;
  input.copyWith = config.get<boolean>('copyWith') ?? false;
  input.fastMode = config.get<boolean>('fastMode') ?? false;
  input.nullSafety = config.get<boolean>('nullSafety') ?? true;
  input.runBuilder = config.get<boolean>('runBuilder') ?? true;
  input.primaryConfiguration = config.get<boolean>('primaryConfiguration') ?? false;
  input.targetDirectory = config.get<string>('targetDirectory.path') ?? "/lib/models";
  return input;
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
      const input = getConfiguration();

      if (Object.keys(objects[0]).every((key) => Object.keys(input).includes(key))) {
        window.showInformationMessage('Configuration from the file models.jsonc was moved to the Settings/Extensions/JSON To Dart Model. - Configure a new option in the settings and remove the configuration item from the file models.jsonc to avoid this warning.');
        return;
      }

      const targetDirectory = models.directory + input.targetDirectory;
      const duplicates = await models.duplicatesClass(objects);

      if (duplicates.length) {
        for (const name of duplicates) {
          if (name === undefined) {
            window.showWarningMessage('Some JSON objects do not have a class name');
            return;
          }
          window.showWarningMessage(`Rename any of the duplicate class ${name} to continue`);
          return;
        }
      }

      const fastMode = input.fastMode ?? false;
      const confirm = !fastMode ? await models.getConfirmation() : fastMode;

      if (confirm && !objects.length) {
        window.showInformationMessage('models.jsonc file is empty');
        return;
      }

      if (confirm && objects.length) {
        // Start converting.
        for await (const object of objects) {
          // Class name key.
          const key = '__className';
          // Separate class names from objects.
          const { [key]: className, ...jsonObject } = object;
          // Conver back to json.
          const json = JSON.stringify(jsonObject);
          // Check if the class name is not missing.
          if (className === undefined) {
            window.showWarningMessage('Some JSON objects do not have a class name');
            return;
          }
          // Set settings.
          const settings = new Settings(
            className,
            <string>targetDirectory,
            json,
            input,
            runFromFile
          );
          generateClass(settings);
        }
        window.showInformationMessage('Models successfully added');
        // Format directories
        for await (const object of objects) {
          // Class name key.
          const key = '__className';
          // Separate class names from objects.
          const { [key]: className } = object;
          await dartFormat(targetDirectory, className);
        }
        if (input.generate && input.runBuilder) {
          runBuildRunner();
        }
      }
    }
  } else {
    models.create();
  }
}

async function transformFromSelection(uri: Uri) {
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
    input = await getUserInput();
  }

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
      generateClass(new Settings(
        className,
        <string>targetDirectory,
        json,
        input
      ))).then((_) => {
        dartFormat(<string>targetDirectory, "models");
        if (input.generate && input.runBuilder) {
          runBuildRunner();
        }
      })
    .catch(handleError);
}

async function transformFromSelectionToCodeGen(uri: Uri) {
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
      generateClass(new Settings(
        className,
        <string>targetDirectory,
        json,
        input
      )))
    .then((_) => {
      dartFormat(<string>targetDirectory, "models");
      if (input.generate && input.runBuilder) {
        runBuildRunner();
      }
    }).catch(handleError);
}

async function transformFromClipboard(uri: Uri) {
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
    input = await getUserInput();
  }

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
      generateClass(new Settings(
        className,
        <string>targetDirectory,
        json,
        input
      ))).then((_) => {
        dartFormat(<string>targetDirectory, "models");
        if (input.generate && input.runBuilder) {
          runBuildRunner();
        }
      })
    .catch(handleError);
}

async function transformFromClipboardToCodeGen(uri: Uri) {
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
      generateClass(new Settings(
        className,
        <string>targetDirectory,
        json,
        input
      )))
    .then((a) => {
      dartFormat(<string>targetDirectory, "models");
      if (input.generate && input.runBuilder) {
        runBuildRunner();
      }
    }).catch(handleError);
}

function promptForBaseClassName(): Thenable<string | undefined> {
  const classNamePromptOptions: InputBoxOptions = {
    prompt: "Base Class Name",
    placeHolder: "User",
  };
  return window.showInputBox(classNamePromptOptions);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
  const rootPath = workspace.workspaceFolders![0].uri.path;
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select a folder to create the Models",
    canSelectFolders: true,
    defaultUri: Uri.parse(rootPath?.replace(/\\/g, "/") + "/lib/"),
  };

  return window.showOpenDialog(options).then((uri) => {
    if (_.isNil(uri) || _.isEmpty(uri)) {
      return rootPath?.replace(/\\/g, "/") + "/lib/";
    }
    return uri[0].fsPath;
  });
}

async function generateClass(settings: Settings) {
  const classDirectoryPath = `${settings.targetDirectory}`;
  if (!fs.existsSync(classDirectoryPath)) {
    await createDirectory(classDirectoryPath);
  }
  await createClass(settings);
}

function createDirectory(targetDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirp(targetDirectory)
      .then((_) => resolve())
      .catch((error) => reject(error));
  });
}

async function addCodeGenerationLibraries() {
  let folderPath = workspace.workspaceFolders![0].uri.path;

  const targetPath = `${folderPath}/pubspec.yaml`;

  if (fs.existsSync(targetPath)) {
    appendPubspecDependencies(targetPath)
      .then((_) => window.showInformationMessage("Dependencies added!"))
      .catch(handleError);
  } else {
    window.showErrorMessage("pubspec.yaml does't exist :/");
  }
}
