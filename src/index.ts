
import {
	Uri,
	ExtensionContext,
	commands,
	window,
	OpenDialogOptions,
	workspace
} from "vscode";
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
import * as _ from "lodash";

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

async function transformFromClipboard(uri: Uri) {
	getClipboardText()
		.then(validateLength)
		.then(parseJson)
		.then(async selectedText => {
			let targetDirectory;
			if (_.isNil(_.get(uri, "fsPath")) || !fs.lstatSync(uri.fsPath).isDirectory()) {
				targetDirectory = await promptForTargetDirectory();
				if (_.isNil(targetDirectory)) {
					window.showErrorMessage("Please select a valid directory");
					return;
				}
			} else {
				targetDirectory = uri.fsPath;
			}
			var keys = "";
			Object.keys(selectedText).forEach(key => keys += getTypeofProperty(selectedText[key]) + "\n");
			pasteToMarker(keys + "\n" + targetDirectory);
		})
		.catch(handleError);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
	const options: OpenDialogOptions = {
		canSelectMany: false,
		openLabel: "Select a folder to create the Models",
		canSelectFolders: true,
		defaultUri: Uri.parse(workspace.rootPath + "")
	};

	return window.showOpenDialog(options).then(uri => {
		if (_.isNil(uri) || _.isEmpty(uri)) {
			return undefined;
		}
		return uri[0].fsPath;
	});
}