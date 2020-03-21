import * as copyPaste from "copy-paste";
import { ViewColumn, window } from "vscode";

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
