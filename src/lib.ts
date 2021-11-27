import * as copyPaste from 'copy-paste';
import * as path from 'path';

import { ViewColumn, window } from 'vscode';
import { ClassDefinition } from './syntax';
import { ModelGenerator } from './model-generator';
import { Settings } from './settings';
import { fm } from './utils';
import { jsonc } from 'jsonc';

export function getClipboardText(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    copyPaste.paste((err, text) => {
      if (err !== null) {
        reject(err);
      }
      resolve(text);
    });
  });
}

export function handleError(error: Error) {
  const text = error.message;
  window.showErrorMessage(text);
}

export function pasteToMarker(content: string) {
  const { activeTextEditor } = window;

  return activeTextEditor?.edit((editBuilder) => {
    editBuilder.replace(activeTextEditor.selection, content);
  });
}

export function getSelectedText(): Promise<string> {
  const { selection, document } = window.activeTextEditor!;
  return Promise.resolve(document.getText(selection).trim());
}

export const validateJSON = (text: any) => {
  const [err, result] = jsonc.safe.parse(text);

  if (text.length === 0) {
    return Promise.reject(new Error('Nothing selected'));
  } else {
    if (err) {
      return Promise.reject(new Error(`Failed to parse JSON. ${err.name}: ${err.message}`));
    } else {
      return Promise.resolve(JSON.stringify(result) as any);
    }
  }
};

export function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return ViewColumn.One;
  }

  switch (activeEditor.viewColumn) {
    case ViewColumn.One:
      return ViewColumn.Two;
    case ViewColumn.Two:
      return ViewColumn.Three;
  }

  return activeEditor.viewColumn as any;
}

export function parseJSON(json: string): { [key: string]: any } {
  const tryEval = (str: any) => eval(`const a = ${str}; a`);

  try {
    return jsonc.parse(json);
  } catch (ignored) { }

  try {
    return tryEval(json);
  } catch (error) {
    return new Error('Selected string is not a valid JSON');
  }
}

export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function isObject(value: any): boolean {
  return (
    Object.keys(value).length !== 0 &&
    Object.values(value).every(
      (item) => typeof item === typeof Object.values(value)[0]
    )
  );
}

export async function createClass(settings: Settings) {
  var modelGenerator = new ModelGenerator(settings);
  var classes: ClassDefinition[] = await modelGenerator.generateDartClasses(settings.json);

  for await (var classDef of classes) {
    const enhancement = settings.model.enhancement;
    const fileName = `${classDef.path}${enhancement}.dart`;
    const file = path.join(settings.targetDirectory, fileName);

    if (fm.existsSync(file)) {
      window.showInformationMessage(`${fileName} already exists`);
    } else {
      const data = settings.input.generate ?
        classDef.toCodeGenString(settings.input) :
        classDef.toString(settings.input);

      await fm.writeFile(file, data);
    }
  }
}