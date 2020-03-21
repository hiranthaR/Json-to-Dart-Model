
import { Uri, ExtensionContext, commands } from "vscode";
import {
	handleError,
	getClipboardText,
	pasteToMarker,
	getSelectedText,
	validateLength,
	getViewColumn,
	parseJson,
	getTypeofProperty
} from "./lib";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromSelection", transformFromSelection)
	);
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromClipboard", transformFromClipboard)
	);
}

function transformFromSelection() {
	const tmpFilePath = path.join(os.tmpdir(), "Object.dart");
	const tmpFileUri = Uri.file(tmpFilePath);

	getSelectedText()
		.then(validateLength)
		.then(parseJson)
		.then(selectedText => {
			fs.writeFileSync(tmpFilePath, selectedText);
		})
		.then(() => {
			commands.executeCommand("vscode.open", tmpFileUri, getViewColumn());
		})
		.catch(handleError);
}

function transformFromClipboard() {
	getClipboardText()
		.then(validateLength)
		.then(parseJson)
		.then(selectedText => {
			var keys = "";
			Object.keys(selectedText).forEach(key => keys += getTypeofProperty(selectedText[key]) + "\n");
			pasteToMarker(keys);
		})
		.catch(handleError);
}
