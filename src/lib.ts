import * as copyPaste from "copy-paste";
import { ViewColumn, window } from "vscode";
import * as fs from "fs";
import { ModelGenerator } from "./model_generator";
import { ClassDefinition } from "./syntax";
import { pascalCase } from "./helper";
import { Settings } from "./settings";

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
  var classes: Array<ClassDefinition> = modelGenerator.generateDartClasses(
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
      resolve;
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
