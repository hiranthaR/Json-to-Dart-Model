import * as copyPaste from "copy-paste";
import { ViewColumn, window } from "vscode";
import * as changeCase from "change-case";
import {
    getClassTemplate
} from "./template";
import * as fs from "fs";

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

    return activeTextEditor?.edit(editBuilder => {
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
export function getTypeofProperty(object: any, key: string) {
    if (isArray(object)) {
        if (isSameTypeInArray(object, key)) {
            return `List<${getArrayItemType(object, key)}>`;
        } else {
            return `List<Object>`;
        }
    }
    var type = typeof object + "";
    if (type === "number") {
        return object % 1 === 0 ? "int" : "double";
    }
    // if (type === "object" && isMap(object, key)) {
    //     return `Map<String,${getMapItemType(object, key)}>`;
    // }
    return type;
}

export function isArray(value: any): boolean {
    return Array.isArray(value);
}

export function isSameTypeInArray(value: any, key: string): boolean {
    return Array.isArray(value) && value.length !== 0 && value.every(item => getTypeofProperty(item, key) === getTypeofProperty(value[0], key));
}

export function getArrayItemType(obj: any, key: string): string {
    return mapTsTypeToDartType(getTypeofProperty(obj[0], key), key, obj) ?? "Object";
}

export function isMap(value: any, key: string): boolean {
    return Object.keys(value).length !== 0
        && Object.values(value).every(item => getTypeofProperty(item, key) === getTypeofProperty(Object.values(value)[0], key));
}

function getMapItemType(obj: any, key: string): string {
    return mapTsTypeToDartType(getTypeofProperty(Object.values(obj)[0], key), key, obj) ?? "Object";
}

export function mapTsTypeToDartType(type: string, key: String, obj: any): string {
    const types: { [name: string]: string } = {
        "integer": "int",
        "string": "String",
        "boolean": "bool",
        "object": changeCase.pascalCase(key.toLowerCase()),
        "map": `Map<String,String>`,
        "double": "double"
    };
    return types[type] ?? type;
}

export function isPremitiveType(type: string, key: String, obj: any): boolean {
    const types = [
        "int",
        "string",
        "double",
        "boolean"
    ];
    return types.includes(type);
}

export
    async function createClass(
        className: string,
        targetDirectory: string,
        object: any
    ) {

    Object.keys(object)
        .filter(key => getTypeofProperty(object[key], key) === "object")
        .forEach(async key => {
            await createClass(key, targetDirectory, object[key]);
        });

    const pascalClassName = changeCase.pascalCase(className.toLowerCase());
    const snakeClassName = changeCase.snakeCase(className.toLowerCase());
    const targetPath = `${targetDirectory}/models/${snakeClassName}.dart`;

    if (fs.existsSync(targetPath)) {
        throw Error(`${snakeClassName}.dart already exists`);
    }

    return new Promise(async (resolve, reject) => {
        fs.writeFile(
            targetPath,
            (getClassTemplate(pascalClassName, object)),
            "utf8",
            error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            }
        );
    });
}