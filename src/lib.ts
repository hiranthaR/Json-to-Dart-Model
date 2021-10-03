import * as copyPaste from 'copy-paste';
import * as fs from 'fs';
import { ViewColumn, window } from 'vscode';
import { ModelGenerator } from './model-generator';
import { Settings } from './settings';
import { ClassDefinition } from './syntax';
import { pascalCase } from './utils';


export function getClipboardText() {
  try {
    return Promise.resolve(copyPaste.paste());
  } catch (error) {
    return Promise.reject(error);
  }
}

export function handleError(error: Error) {
  const separateWithSpace = (v: string) => v === v.toUpperCase() ? ` ${v}` : v;
  const name = error.name.split('').map(separateWithSpace).join('').trim();
  window.showErrorMessage(`${name}: ${error.message}`);
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

export const validateLength = (text: any) => {
  if (text.length === 0) {
    return Promise.reject(new Error('Nothing selected'));
  } else {
    return Promise.resolve(text);
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

export function parseJson(json: string): { [key: string]: any } {
  const tryEval = (str: any) => eval(`const a = ${str}; a`);

  try {
    return JSON.parse(json);
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

export function isMap(value: any): boolean {
  return (
    Object.keys(value).length !== 0 &&
    Object.values(value).every(
      (item) => typeof item === typeof Object.values(value)[0]
    )
  );
}

export function mapTsTypeToDartType(
  type: string,
  key: String,
  obj: any
): string {
  const types: { [name: string]: string } = {
    integer: 'int',
    string: 'String',
    boolean: 'bool',
    object: pascalCase(key.toLowerCase()),
    map: 'Map<String,String>',
    double: 'double',
  };
  return types[type] ?? type;
}

export async function createClass(settings: Settings) {
  var modelGenerator = new ModelGenerator(settings);
  var classes: ClassDefinition[] = await modelGenerator.generateDartClasses(settings.object);

  for (var i = 0; i < classes.length; ++i) {
    const classDef = classes[i];
    const enhancement = settings.model.nameEnhancement;
    const path = `${settings.targetDirectory}/${classDef.path}` + enhancement + '.dart';

    if (fs.existsSync(path)) {
      window.showInformationMessage(`${classDef.path}` + enhancement + '.dart already exists');
    } else {
      const data = settings.input.generate ?
        classDef.toCodeGenString(settings.input) :
        classDef.toString(settings.input);

      await writeFile(path, data);
    }
  }
}

async function writeFile(path: string, data: string) {
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