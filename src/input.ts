import { window } from "vscode";

interface InputInterface {
    freezed: boolean;
    equatable: boolean;
    immutable: boolean;
    toString: boolean;
    copyWith: boolean;
    equality: boolean;
    isImmutable(): boolean;
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

    isImmutable(): boolean {
        return this.equatable || this.immutable ? true : false;
    }
}

/**
 * UI elements to show messages, selections, and asking for user input.
 */
export async function getUserInput(): Promise<Input> {
    let input = new Input();

    //options.freezed = await askForFreezed();
    if (!input.freezed) {
        input.equatable = await askForEquatableCompatibility();
        if (!input.equatable) {
            input.immutable = await askForImmutableClass();
        }
        input.copyWith = await askForCopyWithMethod();
        input.toString = await askForToStringMethod();
        if (!input.equatable) input.equality = await askForEqualityOperator();
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
        { placeHolder: "Implement `copyWith()` method? (Recommended with immutable classes" }
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

