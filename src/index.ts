import {
  ExtensionContext,
  commands,
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
import { fm } from './utils';
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

export const generateClass = async (settings: Settings) => {
  const dir = settings.targetDirectory;
  
  if (!fm.existsSync(dir)) {
    await fm.createDirectory(dir);
  }

  await createClass(settings);
};
