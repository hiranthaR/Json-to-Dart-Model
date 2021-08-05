import * as copyPaste from "copy-paste";
import * as fs from "fs";

import { ViewColumn, window } from "vscode";
import { ModelGenerator } from "./model-generator";
import { ClassDefinition } from "./syntax";
import { pascalCase } from "./utils";
import { Settings } from "./settings";

export function getClipboardText() {
  try {
    return Promise.resolve(copyPaste.paste());
  } catch (error) {
    return Promise.reject(error);
  }
}

export function handleError(error: Error) {
  let separateWithSpace = (v: string) => v === v.toUpperCase() ? ` ${v}` : v;
  let name = error.name.split('').map(separateWithSpace).join('').trim();
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
    return Promise.reject(new Error("Nothing selected"));
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
    return new Error("Selected string is not a valid JSON");
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
    integer: "int",
    string: "String",
    boolean: "bool",
    object: pascalCase(key.toLowerCase()),
    map: `Map<String,String>`,
    double: "double",
  };
  return types[type] ?? type;
}

export async function createClass(settings: Settings) {
  var modelGenerator = new ModelGenerator(settings);
  var classes: Array<ClassDefinition> = await modelGenerator.generateDartClasses(
    settings.object
  );

  return new Promise<void>(async (resolve, reject) => {
    classes.map((c) => {
      const targetPath = `${settings.targetDirectory}/${c.path}.dart`;
      if (fs.existsSync(targetPath)) {
        window.showInformationMessage(`${c.path}.dart already exists`);
        return;
      }

      fs.writeFile(
        targetPath,
        settings.input.generate
          ? c.toCodeGenString(settings.input)
          : c.toString(settings.input),
        "utf8",
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }
      );
    });
  });
}