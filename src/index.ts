
import {
	Uri,
	ExtensionContext,
	commands,
	window,
	OpenDialogOptions,
	workspace,
	InputBoxOptions
} from "vscode";
import {
	handleError,
	getClipboardText,
	getSelectedText,
	validateLength,
	getViewColumn,
	parseJson,
	createClass,
	isArray,
	pasteToMarker
} from "./lib";

import * as parse from "json-to-ast";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as _ from "lodash";
import * as mkdirp from "mkdirp";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromSelection", transformFromSelection)
	);
	context.subscriptions.push(
		commands.registerCommand("jsonToDart.fromClipboard", transformFromClipboard)
	);
}

async function transformFromSelection(uri: Uri) {
	const className = await promptForBaseClassName();
	if (_.isNil(className) || className.trim() === "") {
		window.showErrorMessage("The class name must not be empty");
		return;
	}

	let targetDirectory: String | undefined;
	if (_.isNil(_.get(uri, "fsPath")) || !fs.lstatSync(uri.fsPath).isDirectory()) {
		targetDirectory = await promptForTargetDirectory();
		if (_.isNil(targetDirectory)) {
			window.showErrorMessage("Please select a valid directory");
			return;
		}
	} else {
		targetDirectory = uri.fsPath;
	}

	getSelectedText()
		.then(validateLength)
		.then(json => generateClass(className, <string>targetDirectory, json))
		.catch(handleError);
}

async function transformFromClipboard(uri: Uri) {

	const className = await promptForBaseClassName();
	if (_.isNil(className) || className.trim() === "") {
		window.showErrorMessage("The class name must not be empty");
		return;
	}

	let targetDirectory: String | undefined;
	if (_.isNil(_.get(uri, "fsPath")) || !fs.lstatSync(uri.fsPath).isDirectory()) {
		targetDirectory = await promptForTargetDirectory();
		if (_.isNil(targetDirectory)) {
			window.showErrorMessage("Please select a valid directory");
			return;
		}
	} else {
		targetDirectory = uri.fsPath;
	}

	getClipboardText()
		.then(validateLength)
		.then(json => generateClass(className, <string>targetDirectory, json));
		// .catch(handleError);
}

function promptForBaseClassName(): Thenable<string | undefined> {
	const classNamePromptOptions: InputBoxOptions = {
		prompt: "Base Class Name",
		placeHolder: "Pojo Response"
	};
	return window.showInputBox(classNamePromptOptions);
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

async function generateClass(
	className: string,
	targetDirectory: string,
	object: string
) {
	const classDirectoryPath = `${targetDirectory}/models`;
	if (!fs.existsSync(classDirectoryPath)) {
		await createDirectory(classDirectoryPath);
	}
	await createClass(className, targetDirectory, object);

}

function createDirectory(targetDirectory: string): Promise<void> {
	return new Promise((resolve, reject) => {
		mkdirp(targetDirectory)
			.then(value => resolve())
			.catch(error => reject(error));
	});
}
