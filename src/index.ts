import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import {
  commands,
  ExtensionContext, TextDocument, window,
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
import { createClass } from './lib';
import { models } from './models-file';
import { Settings } from './settings';

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

  // Run builder if new objects detected on save.
  if (models.exist) {
    let previous = models.getModels(false);
    workspace.onDidSaveTextDocument((document: TextDocument) => {
      if (document.languageId !== 'jsonc' || !document.fileName.endsWith('/models.jsonc')) { return; };
      const current = models.getModels(false);
      if (previous === undefined || current === undefined) { return; }
      if (previous.length !== current.length) {
        previous = current;
        transformFromFile();
      }
    });
  }
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
