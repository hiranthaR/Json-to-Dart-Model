import { commands, Uri, window, workspace } from "vscode";
import { printLine } from "./syntax";
import * as fs from "fs";
import { Input } from "./input";

export class Models {
    private fileName: string = "/models.jsonc";

    get directory() {
        return workspace.rootPath;
    }

    get file(): string {
        return this.directory + this.fileName;
    }

    get exist(): boolean {
        return fs.existsSync(this.file);
    }

    get data(): string {
        return fs.readFileSync(this.file, 'utf-8');
    }

    private toString() {
        let sb = '';
        sb += printLine('// GENERATED CODE - READ DOCUMENTATION BEFORE CONFIGURATION');
        sb += printLine('[', 1);
        sb += printLine('// **************************************************************************', 1, 1);
        sb += printLine('// Json To Dart Model Configuration', 1, 1);
        sb += printLine('// **************************************************************************', 1, 1);
        sb += printLine('//', 1, 1);
        sb += printLine('// Useful links to work with this file:', 1, 1);
        sb += printLine('// About jsonc: https://github.com/onury/jsonc', 1, 1);
        sb += printLine('// Try jsonc: https://komkom.github.io', 1, 1);
        sb += printLine('{', 1, 1);
        sb += printLine('// Generates Freezed classes.', 1, 2);
        sb += printLine('// If it\'s true, everything below will be ignored because Freezed supports them all.', 1, 2);
        sb += printLine('"freezed": false,', 1, 2);
        sb += printLine('// Enable Json Serializable builder.', 1, 2);
        sb += printLine('"serializable": false,', 1, 2);
        sb += printLine('// Enable Equatable support.', 1, 2);
        sb += printLine('// If it\'s true, equality operator and immutability will be ignored.', 1, 2);
        sb += printLine('"equatable": false,', 1, 2);
        sb += printLine('// Generate immutable classes.', 1, 2);
        sb += printLine('"immutable": false,', 1, 2);
        sb += printLine('// Add toString method to improve the debugging experience.', 1, 2);
        sb += printLine('"toString": false,', 1, 2);
        sb += printLine('// Add copyWith method (Recommended with immutable classes).', 1, 2);
        sb += printLine('"copyWith": false,', 1, 2);
        sb += printLine('// Add equality operator.', 1, 2);
        sb += printLine('"equality": false,', 1, 2);
        sb += printLine('// Indicate that a variable can have the value null.', 1, 2);
        sb += printLine('"nullSafety": false,', 1, 2);
        sb += printLine('// Default target directory.', 1, 2);
        sb += printLine('"targetDirectory": "/lib/models",', 1, 2);
        sb += printLine('// Activate as primary global configuration.', 1, 2);
        sb += printLine('"primaryConfiguration": false,', 1, 2);
        sb += printLine('// Disable ask for confirmation to start the conversion.', 1, 2);
        sb += printLine('"fastMode": false', 1, 2);
        sb += printLine('}', 1, 1);
        sb += printLine('// Add your json objects here separated by commas.', 1, 1);
        sb += printLine('// Configuration item must be first in the list.', 1, 1);
        sb += printLine('// Note that you add class names to each object with key "__className":', 1, 1);
        sb += printLine('// And avoid duplicate class names in this list for best results.', 1, 1);
        sb += printLine('// FOR EXAMPLE:', 1, 1);
        sb += printLine('/*\n', 1, 1);
        sb += printLine('{', 1, 1);
        sb += printLine('"__className": "UserPost", // <- The base class name of the object.', 1, 2);
        sb += printLine('"userId": 1,', 1, 2);
        sb += printLine('"id": 1, // To mark as required value, change "id" to "d@id".', 1, 2);
        sb += printLine('"title": "Json To Dart Model", // To mark as a default value, change "title" to "d@title".', 1, 2);
        sb += printLine('"body": "Json to Dart advanced..."', 1, 2);
        sb += printLine('}\n', 1, 1);
        sb += printLine('*/', 1, 1);
        sb += printLine(']', 1);
        return sb;
    }

    async duplicatesClass(objects: any[]): Promise<string[]> {
        return objects.map((o) => {
            const { ['__className']: className } = o;
            return className;
        }).filter((n, i, arr) => arr.indexOf(n) !== i);
    }

    async create(): Promise<void> {
        const text = "models.jsonc file was created for the first time";
        const accepted = await askForFileCreation();
        if (accepted) {
            fs.writeFile(this.file, this.toString(), "utf8", (err) => {
                if (err) {
                    return console.error(err);
                }
                window.showInformationMessage(text);
                return;
            });
        }
    }

    private async validateSettings(input: Input, showMessage: boolean = true): Promise<boolean> {
        const settings = Object.entries(input);
        for (const v of settings) {
            const key = v[0];
            const value = v[1];
            if (value === undefined || typeof value === "function") {
                const text = `The key "${key}" was not found in the models.jsonc configuration.`;
                if (showMessage) {
                    window.showInformationMessage(text, ...["Help"]).then(getHelp);
                }
                return false;
            }
        }
        return true;
    }

    async getConfirmation(): Promise<boolean> {
        return window.showInformationMessage(
            'Start building JSON models?\n\nBuilds from file models.jsonc',
            { modal: true }, ...["Start"]).then((action) => {
                return action === "Start" ? true : false;
            });
    }

    async getConfiguration(showMessage: boolean = false): Promise<Input | undefined> {
        const jsonc = require('jsonc').safe;
        if (this.exist) {
            const [err, result] = jsonc.parse(this.data);
            if (!err) {
                // All json objects from the models.jsonc.
                const objects: any[] = result;
                // User configuration.
                const input = new Input(objects[0]);
                const isValid = await this.validateSettings(input, showMessage);

                if (isValid) {
                    return input;
                }
            }
        }
        return undefined;
    }
}

function getHelp(needHelp: string | undefined) {
    if (needHelp === "Help") {
        const uri = Uri.parse("https://github.com/hiranthaR/Json-to-Dart-Model#convert-from-file");
        commands.executeCommand('vscode.open', uri);
    }
}

async function askForFileCreation(): Promise<boolean> {
    const text = 'models.jsonc file not found.'
        + '\n\n\Do you want it to be created for you?';
    return window.showInformationMessage(text, { modal: true }, ...["Add"])
        .then((action) => action === "Add" ? true : false);
}