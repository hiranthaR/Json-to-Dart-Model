import * as _ from "lodash";

import { InputBoxOptions, OpenDialogOptions, Uri, window } from "vscode";
import { getConfiguration, getWorkspaceRoot } from "./utils";

/** To string method type */
export enum StringMethod {
    Default = "Default",
    Auto = "Auto",
    Stringify = "Stringify",
    Dart = "Dart",
}
/** Equality method type */
export enum Equality {
    Default = "Default",
    Equatable = "Equatable",
    Dart = "Dart",
}
/** Supported code generators */
export enum CodeGenerator {
    Default = "Default",
    JSON = "JSON",
    Freezed = "Freezed",
}

interface InputProperties {
    codeGenerator: CodeGenerator;
    immutable: boolean;
    toString: StringMethod;
    copyWith: boolean;
    equality: Equality;
    nullSafety: boolean;
    /**
     * Required root path. [workspace.workspaceFolders![0].uri.path] 
     */
    targetDirectory: string;
    runBuilder: boolean;
    primaryConfiguration: boolean;
    fastMode: boolean;
}

/**
 * The class which provide all user inputs.
 */
export class Input implements InputProperties {
    codeGenerator: CodeGenerator = CodeGenerator.Default;
    immutable: boolean = false;
    toString: StringMethod = StringMethod.Default;
    copyWith: boolean = false;
    equality: Equality = Equality.Default;
    nullSafety: boolean = true;
    targetDirectory: string = '/lib/models';
    runBuilder: boolean = true;
    primaryConfiguration: boolean = false;
    fastMode: boolean = false;

    get isImmutable(): boolean {
        return this.equality === "Equatable" || this.immutable;
    }

    get generate(): boolean {
        return this.freezed || this.serializable;
    }

    get equatable(): boolean {
        return this.equality === "Equatable";
    }

    get freezed(): boolean {
        return this.codeGenerator === CodeGenerator.Freezed;
    }

    get serializable(): boolean {
        return this.codeGenerator === CodeGenerator.JSON;
    }

    get isAutoOrStringify(): boolean {
        return this.equatable && this.toString === "Auto" || this.equatable && this.toString === "Stringify";
    }

    get isAutoOrToStringMethod(): boolean {
        return !this.equatable && this.toString === "Auto" || !this.equatable && this.toString === "Dart";
    }
}

/**
 * UI elements to show messages, selections, and asking for user input.
 * @generate indicates whether selected code generator.
 */
export const getUserInput = async (generate: boolean = false): Promise<Input> => {
    const config = getConfiguration();
    let input = new Input();

    input.runBuilder = config.runBuilder;

    if (generate) {
        input.codeGenerator = await promptForCodeGenerator();
        if (input.freezed) {
            input.nullSafety = config.nullSafety;
        }
    }
    // Freezed supports all the methods and you do not have to ask the user about the rest.
    if (!input.freezed) {
        input.equality = await promptForEqualityOperator();
        if (input.equality !== "Equatable") {
            input.immutable = await promptForImmutableClass();
        }
        const isEquatable = input.equality === "Equatable";
        input.toString = await promptForToStringMethod(isEquatable);
        input.copyWith = await promptForCopyWithMethod();
        input.nullSafety = config.nullSafety;
    }
    return input;
};
/**
 * Code generation for immutable classes that has a simple syntax/API without compromising on the features.
 */
async function promptForCodeGenerator(): Promise<CodeGenerator> {
    const selection = await window.showQuickPick(
        [
            {
                label: "JSON Serializable",
                picked: true,
            },
            {
                label: "Freezed",
                picked: true,
            },
        ],
        { placeHolder: "Generate advanced immutable classes? (Freezed)" }
    );

    switch (selection?.label) {
        case "Freezed":
            return CodeGenerator.Freezed;
        default:
            return CodeGenerator.JSON;
    }
}

async function promptForCopyWithMethod(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Implement `copyWith()` method?" }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function promptForImmutableClass(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Do you want use immutable classes?" }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function promptForToStringMethod(isEquatableEnabled: boolean = false): Promise<StringMethod> {
    const withEquatable = [
        {
            label: "No",
            picked: true,
        },
        {
            label: "Dart",
            picked: true,
        },
        {
            label: "Stringify",
            picked: true,
        },
    ];
    const withoutEquatable = [
        {
            label: "No",
            picked: true,
        },
        {
            label: "Yes",
            picked: true,
        },
    ];
    const selectionEntries = isEquatableEnabled ? withEquatable : withoutEquatable;

    const selection = await window.showQuickPick(
        selectionEntries,
        { placeHolder: "Implement `toString()` method?" }
    );

    switch (selection?.label) {
        case "Yes":
            return StringMethod.Dart;
        case "Dart":
            return StringMethod.Dart;
        case "Stringify":
            return StringMethod.Stringify;
        default:
            return StringMethod.Default;
    }
}

async function promptForEqualityOperator(): Promise<Equality> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            {
                label: "Dart",
                picked: true,
            },
            {
                label: "Equatable",
                picked: true,
            },
        ],
        { placeHolder: "Implement equality operator?" }
    );

    switch (selection?.label) {
        case "Dart":
            return Equality.Dart;
        case "Equatable":
            return Equality.Equatable;
        default:
            return Equality.Default;
    }
}

export const promptForBaseClassName = (): Thenable<string | undefined> => {
    const classNamePromptOptions: InputBoxOptions = {
        prompt: "Base Class Name",
        placeHolder: "User",
    };
    return window.showInputBox(classNamePromptOptions);
};

export const promptForTargetDirectory = async (): Promise<string | undefined> => {
    const workspaceRoot = getWorkspaceRoot();
    const options: OpenDialogOptions = {
        canSelectMany: false,
        openLabel: "Select a folder to create the Models",
        canSelectFolders: true,
        defaultUri: Uri.parse(workspaceRoot?.replace(/\\/g, "/") + "/lib/"),
    };

    return window.showOpenDialog(options).then((uri) => {
        if (_.isNil(uri) || _.isEmpty(uri)) {
            return workspaceRoot?.replace(/\\/g, "/") + "/lib/";
        }
        return uri[0].fsPath;
    });
};