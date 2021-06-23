import { window } from "vscode";
import { getConfiguration } from "./index";

interface InputInterface {
    freezed: boolean;
    equatable: boolean;
    immutable: boolean;
    toString: boolean;
    copyWith: boolean;
    equality: boolean;
    serializable: boolean;
    nullSafety: boolean;
    /**
     * Required root path. [workspace.workspaceFolders![0].uri.path] 
     */
    targetDirectory: string;
    primaryConfiguration: boolean;
    fastMode: boolean;
}

/**
 * The class which provide all user inputs.
 */
export class Input implements InputInterface {
    freezed: boolean = false;
    equatable: boolean = false;
    immutable: boolean = false;
    toString: boolean = false;
    copyWith: boolean = false;
    equality: boolean = false;
    serializable: boolean = false;
    nullSafety: boolean = true;
    targetDirectory: string = '/lib/models';
    primaryConfiguration: boolean = false;
    fastMode: boolean = false;

    get isImmutable(): boolean {
        return this.equatable || this.immutable ? true : false;
    }

    get generate(): boolean {
        return this.freezed || this.serializable ? true : false;
    }
}

/**
 * UI elements to show messages, selections, and asking for user input.
 * @generate indicates whether selected code generator.
 */
export async function getUserInput(generate: boolean = false): Promise<Input> {
    let input = new Input();

    input.serializable = generate;

    if (generate) {
        input.freezed = await askForFreezed();
        if (input.freezed) {
            input.nullSafety = getConfiguration().nullSafety;
        }
    }
    // Freezed supports all the methods and you do not have to ask the user about the rest.
    if (!input.freezed) {
        input.equatable = await askForEquatableCompatibility();
        if (!input.equatable) {
            input.immutable = await askForImmutableClass();
            input.equality = await askForEqualityOperator();
        }
        input.toString = await askForToStringMethod();
        input.copyWith = await askForCopyWithMethod();
        input.nullSafety = getConfiguration().nullSafety;
    }
    return input;
}
/**
 * Code generation for immutable classes that has a simple syntax/API without compromising on the features.
 */
async function askForFreezed(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Generate advanced immutable classes? (Freezed)" }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

/**
 * An abstract class that helps to implement equality without needing to explicitly override == and hashCode.
 */
async function askForEquatableCompatibility(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Enable support for advanced equality check? (Equatable)" }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function askForCopyWithMethod(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Implement `copyWith()` method? (Recommended with immutable classes)" }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function askForImmutableClass(): Promise<boolean> {
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

async function askForToStringMethod(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Implement `toString()` in your classes? To improve the debugging experience." }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function askForEqualityOperator(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: "No",
                picked: true,
            },
            { label: "Yes" },
        ],
        { placeHolder: "Implement equality operator `==`? To compare different instances of `Objects`." }
    );

    switch (selection?.label) {
        case "Yes":
            return true;
        default:
            return false;
    }
}