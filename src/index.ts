import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

import { ExtensionContext, commands, window } from "vscode";
import { handleError, createClass, appendPubspecDependencies } from "./lib";
import {
  transformFromClipboard,
  transformFromClipboardToCodeGen,
  transformFromFile,
  transformFromSelection,
  transformFromSelectionToCodeGen,
} from "./commands";
import { Settings } from "./settings";
import { getWorkspaceRoot } from "./utils";

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
export const runDartFormat = (directory: string, lastDirectory: string) => {
  const startIndex = directory.indexOf("lib/");
  const formatDirectory = directory.substring(startIndex).split("/").join(" ");
  const fileDirectory = formatDirectory + " " + lastDirectory.toLowerCase();
  const terminal = window.createTerminal({ name: "dart format bin", hideFromUser: true });
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
  let workspaceRoot = getWorkspaceRoot();

  const targetPath = `${workspaceRoot}/pubspec.yaml`;

  if (fs.existsSync(targetPath)) {
    appendPubspecDependencies(targetPath)
      .then((_) => window.showInformationMessage("Dependencies added!"))
      .catch(handleError);
  } else {
    window.showErrorMessage("pubspec.yaml does't exist :/");
  }
}
