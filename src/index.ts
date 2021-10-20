import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import {
  ExtensionContext,
  commands, window,
  workspace
} from 'vscode';
import {
  addCodeGenerationLibraries,
  transformFromClipboard,
  transformFromClipboardToCodeGen,
  transformFromFile,
  transformFromSelection,
  transformFromSelectionToCodeGen
} from './commands';
import { Settings } from './settings';
import { createClass } from './lib';
import { jsonReader } from './json-reader';


export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      'jsonToDart.fromFile',
      transformFromFile
    ),
    commands.registerCommand(
      'jsonToDart.fromSelection',
      transformFromSelection
    ),
    commands.registerCommand(
      'jsonToDart.fromClipboard',
      transformFromClipboard
    ),
    commands.registerCommand(
      'jsonToDart.addCodeGenerationLibraries',
      addCodeGenerationLibraries
    ),
    commands.registerCommand(
      'jsonToDart.fromClipboardToCodeGen',
      transformFromClipboardToCodeGen
    ),
    commands.registerCommand(
      'jsonToDart.fromSelectionToCodeGen',
      transformFromSelectionToCodeGen
    ),
  );

  const disposableOnDidSave = workspace.onDidSaveTextDocument((doc) => jsonReader.onChange(doc));
  context.subscriptions.push(disposableOnDidSave);
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
  const last = directory.split('/').pop();
  if (!last) { return; }
  const index = directory.indexOf('/lib') === -1 ? directory.indexOf(last) : directory.indexOf('/lib');
  const formatDirectory = directory.substring(index).split('/').join(' ');
  const fileDirectory = formatDirectory + ' ' + lastDirectory.toLowerCase();
  const terminal = window.createTerminal({ name: 'dart format bin', hideFromUser: true });
  console.debug('dart format' + fileDirectory);
  terminal.sendText('dart format' + fileDirectory);
};

/**
 * Run "build_runner build".
 */
export const runBuildRunner = () => {
  const terminal = window.createTerminal({ name: 'pub get', hideFromUser: false });
  terminal.sendText(
    'flutter pub run build_runner build --delete-conflicting-outputs'
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
