
import { Uri, ExtensionContext, commands } from "vscode";
import {
	handleError,
	getClipboardText,
	pasteToMarker,
	getSelectedText,
	validateLength,
} from "./lib";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromSelection", transformFromSelection)
	);
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromClipboard", transformFromClipboard)
	);
}

function transformFromSelection() {

}

function transformFromClipboard() {
	getClipboardText().then(validateLength).then(selectedText => {
		pasteToMarker(selectedText + " passed");
	})
		.catch(handleError);
}
