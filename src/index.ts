import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

import { ExtensionContext, commands, window, workspace } from "vscode";
import { handleError, createClass, appendPubspecDependencies } from "./lib";
import {
  transformFromClipboard,
  transformFromClipboardToCodeGen,
  transformFromFile,
  transformFromSelection,
  transformFromSelectionToCodeGen,
} from "./commands";
import { Input } from "./input";
import { ISettings, Settings } from "./settings";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "jsonToDart.fromFile",
      transformFromFile
    ),
    commands.registerCommand(
      "jsonToDart.fromSelection",
      transformFromSelection
    ),
    commands.registerCommand(
      "jsonToDart.fromClipboard",
      transformFromClipboard
    ),
    commands.registerCommand(
      "jsonToDart.addCodeGenerationLibraries",
      addCodeGenerationLibraries
    ),
    commands.registerCommand(
      "jsonToDart.fromClipboardToCodeGen",
      transformFromClipboardToCodeGen
    ),
    commands.registerCommand(
      "jsonToDart.fromSelectionToCodeGen",
      transformFromSelectionToCodeGen
    ),
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
export const dartFormat = (directory: string, lastDirectory: string) => {
  const startIndex = directory.indexOf("lib/");
  const formatDirectory = directory.substring(startIndex).split("/").join(" ");
  const fileDirectory = formatDirectory + " " + lastDirectory.toLowerCase();
  let terminal = window.createTerminal("dart format bin");
  terminal.sendText("dart format bin " + fileDirectory);
};

/**
 * Run "build_runner build".
 */
export const runBuildRunner = () => {
  let terminal = window.createTerminal("pub get");
  terminal.show();
  terminal.sendText(
    "flutter pub run build_runner build --delete-conflicting-outputs"
  );
};

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

export const generateClass = async (settings: Settings) => {
  const classDirectoryPath = `${settings.targetDirectory}`;
  if (!fs.existsSync(classDirectoryPath)) {
    await createDirectory(classDirectoryPath);
  }
  await createClass(settings);
};

function createDirectory(targetDirectory: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await mkdirp(targetDirectory)
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
