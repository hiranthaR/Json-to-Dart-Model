import * as copyPaste from "copy-paste";
import { ViewColumn, window } from "vscode";
import * as changeCase from "change-case";
import * as fs from "fs";
import { ModelGenerator } from "./model_generator";
import { ClassDefinition } from "./syntax";

export function getClipboardText() {
  try {
    return Promise.resolve(copyPaste.paste());
  } catch (error) {
    return Promise.reject(error);
  }
}

export function handleError(error: Error) {
  window.showErrorMessage(error.message);
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
  } catch (ignored) {}

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
    object: changeCase.pascalCase(key.toLowerCase()),
    map: `Map<String,String>`,
    double: "double",
  };
  return types[type] ?? type;
}

export function isPremitiveType(type: string, key: String, obj: any): boolean {
  const types = ["int", "string", "double", "boolean"];
  return types.includes(type);
}

export async function createClass(
  className: string,
  targetDirectory: string,
  object: string,
  codeGen: boolean,
  equatable: boolean = false
) {
  var modelGenerator = new ModelGenerator(className);
  var classes: Array<ClassDefinition> = modelGenerator.generateDartClasses(
    object
  );

  return new Promise(async (resolve, reject) => {
    classes.map((c) => {
      const snakeClassName = changeCase.snakeCase(c.getName());
      const targetPath = `${targetDirectory}/models/${snakeClassName}.dart`;
      if (fs.existsSync(targetPath)) {
        throw Error(`${snakeClassName}.dart already exists`);
      }

      fs.writeFile(
        targetPath,
        codeGen ? c.toCodeGenString(equatable) : c.toString(equatable),
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

export async function appendDependencies(
  targetPath: string,
  dependency: string,
  dev: boolean
): Promise<string> {
  var pubspec = fs.readFileSync(targetPath, "utf8");
  var keyword = "sdk: flutter";

  if (pubspec.includes(dependency)) {
    return Promise.reject(new Error("Dependcies already exist!"));
  }

  var index = pubspec.indexOf(
    keyword,
    dev ? 1 + pubspec.indexOf(keyword) : pubspec.indexOf(keyword)
  );
  if (index > 0) {
    pubspec =
      pubspec.substring(0, index + keyword.length) +
      dependency +
      pubspec.substring(index + keyword.length, pubspec.length);
  }
  return new Promise(async (resolve, reject) => {
    fs.writeFile(targetPath, pubspec.toString(), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function appendPubspecDependencies(targetPath: string) {
  const dependency = "\n  json_annotation:";
  const dependency2 = "\n equatable:";
  const devDependency1 = "\n  build_runner:";
  const devDependency2 = "\n  json_serializable:";

  return Promise.all([
    await appendDependencies(targetPath, dependency, false),
    await appendDependencies(targetPath, dependency2, false),
    await appendDependencies(targetPath, devDependency1, true),
    await appendDependencies(targetPath, devDependency2, true),
  ]);
}
