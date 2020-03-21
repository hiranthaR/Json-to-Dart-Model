
import { Uri, ExtensionContext, commands } from "vscode";

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
}
