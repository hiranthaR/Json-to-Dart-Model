import * as copyPaste from 'copy-paste';
import * as fs from 'fs';

import { ViewColumn, window } from 'vscode';
import { ClassDefinition } from './syntax';
import { ModelGenerator } from './model-generator';
import { Settings } from './settings';
import { jsonc } from 'jsonc';

export function getClipboardText() {
  try {
    return Promise.resolve(copyPaste.paste());
  } catch (error) {
    return Promise.reject(error);
  }
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

  for (var i = 0; i < classes.length; ++i) {
    const classDef = classes[i];
    const enhancement = settings.model.nameEnhancement;
    const path = `${settings.targetDirectory}/${classDef.path}${enhancement}.dart`;

    if (fs.existsSync(path)) {
      window.showInformationMessage(`${classDef.path}${enhancement}.dart already exists`);
    } else {
      const data = settings.input.generate ?
        classDef.toCodeGenString(settings.input) :
        classDef.toString(settings.input);

      await writeFile(path, data);
    }
  }
}

function writeFile(path: string, data: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, 'utf8', (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    }
    );
  });
}