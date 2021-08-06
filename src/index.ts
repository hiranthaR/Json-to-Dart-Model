import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

import { ExtensionContext, commands, window } from "vscode";
import { createClass } from "./lib";
import {
  addCodeGenerationLibraries,
  transformFromClipboard,
  transformFromClipboardToCodeGen,
  transformFromFile,
  transformFromSelection,
  transformFromSelectionToCodeGen,
} from "./commands";
import { Settings } from "./settings";

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
  console.debug("dart format bin " + fileDirectory);
  terminal.sendText("dart format bin " + fileDirectory);
};

/**
 * Run "build_runner build".
 */
export const runBuildRunner = () => {
  let terminal = window.createTerminal("pub get");
  terminal.sendText(
    "flutter pub run build_runner build --delete-conflicting-outputs"
  );
  terminal.show(true);
};

export const generateClass = async (settings: Settings) => {
  const path = `${settings.targetDirectory}`;
  if (!fs.existsSync(path)) {
    await createDirectory(path);
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
