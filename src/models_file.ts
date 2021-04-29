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
        sb += printLine('[', true);
        sb += printLine('// **************************************************************************', true, 1);
        sb += printLine('// Json To Dart Model Configuration', true, 1);
        sb += printLine('// **************************************************************************', true, 1);
        sb += printLine('//', true, 1);
        sb += printLine('// Useful links to work with this file:', true, 1);
        sb += printLine('// About jsonc: https://github.com/onury/jsonc', true, 1);
        sb += printLine('// Try jsonc: https://komkom.github.io', true, 1);
        sb += printLine('{', true, 1);
        sb += printLine('// Generates Freezed classes.', true, 2);
        sb += printLine('// If it\'s true, everything below will be ignored because Freezed supports them all.', true, 2);
        sb += printLine('"freezed": false,', true, 2);
        sb += printLine('// Enable Json Serializable builder.', true, 2);
        sb += printLine('"serializable": false,', true, 2);
        sb += printLine('// Enable Equatable support.', true, 2);
        sb += printLine('// If it\'s true, equality operator and immutability will be ignored.', true, 2);
        sb += printLine('"equatable": false,', true, 2);
        sb += printLine('// Generate immutable classes.', true, 2);
        sb += printLine('"immutable": false,', true, 2);
        sb += printLine('// Add toString method to improve the debugging experience.', true, 2);
        sb += printLine('"toString": false,', true, 2);
        sb += printLine('// Add copyWith method (Recommended with immutable classes).', true, 2);
        sb += printLine('"copyWith": false,', true, 2);
        sb += printLine('// Add equality operator.', true, 2);
        sb += printLine('"equality": false,', true, 2);
        sb += printLine('// Indicate that a variable can have the value null.', true, 2);
        sb += printLine('"nullSafety": false,', true, 2);
        sb += printLine('// Default target directory.', true, 2);
        sb += printLine('"targetDirectory": "/lib/models",', true, 2);
        sb += printLine('// Activate as primary global configuration.', true, 2);
        sb += printLine('"primaryConfiguration": false,', true, 2);
        sb += printLine('// Disable ask for confirmation to start the conversion.', true, 2);
        sb += printLine('"fastMode": false', true, 2);
        sb += printLine('}', true, 1);
        sb += printLine('// Add your json objects here separated by commas.', true, 1);
        sb += printLine('// Configuration item must be first in the list.', true, 1);
        sb += printLine('// Note that you add class names to each object with key "__className":', true, 1);
        sb += printLine('// And avoid duplicate class names in this list for best results.', true, 1);
        sb += printLine('// FOR EXAMPLE:', true, 1);
        sb += printLine('/*\n', true, 1);
        sb += printLine('{', true, 1);
        sb += printLine('"__className": "UserPost",', true, 2);
        sb += printLine('"userId": 1,', true, 2);
        sb += printLine('"id": 1,', true, 2);
        sb += printLine('"title": "Json To Dart Model",', true, 2);
        sb += printLine('"body": "Json to Dart advanced..."', true, 2);
        sb += printLine('}\n', true, 1);
        sb += printLine('*/', true, 1);
        sb += printLine(']', true);
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