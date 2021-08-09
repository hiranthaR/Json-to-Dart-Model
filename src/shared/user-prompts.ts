import * as _ from "lodash";

import { InputBoxOptions, OpenDialogOptions, Uri, window } from "vscode";
import { CodeGenerator, StringMethod, Equality } from "../input";
import { getWorkspaceRoot } from "../utils";

/**
 * Code generation for immutable classes that has a simple syntax/API without compromising on the features.
 */
export async function promptForCodeGenerator(): Promise<CodeGenerator> {
    const selection = await window.showQuickPick(
        [
            {
                label: "JSON Serializable",
                description: "Generator",
                picked: true,
            },
            {
                label: "Freezed",
                description: "Generator",
                picked: true,
            },
        ],
        { placeHolder: "Select code generator" }
    );

    switch (selection?.label) {
        case "Freezed":
            return CodeGenerator.Freezed;
        default:
            return CodeGenerator.JSON;
    }
}

export async function promptForCopyWithMethod(): Promise<boolean> {
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

export async function promptForImmutableClass(): Promise<boolean> {
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

export async function promptForToStringMethod(isEquatableEnabled: boolean = false): Promise<StringMethod> {
    const withEquatable = [
        {
            label: "No",
            picked: true,
        },
        {
            label: "Dart",
            description: "toString method",
            picked: true,
        },
        {
            label: "Stringify",
            description: "Method of Equatable",
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

export async function promptForEqualityOperator(): Promise<Equality> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            {
                label: "Dart",
                description: "Equality operator",
                picked: true,
            },
            {
                label: "Equatable",
                description: "Equality operator",
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