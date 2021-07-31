import { window, workspace } from "vscode";
import { printLine } from "./syntax";
import * as fs from "fs";
import { getWorkspaceRoot } from "./utils";

export class Models {
    private fileName: string = "/models.jsonc";

    get directory() {
        return getWorkspaceRoot();
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
        sb += printLine('// GENERATED FOR JSON TO DART MODEL');
        sb += printLine('[', 1);
        sb += printLine('// Useful links to work with this file:', 1, 1);
        sb += printLine('// About jsonc: https://github.com/onury/jsonc', 1, 1);
        sb += printLine('// Try jsonc: https://komkom.github.io', 1, 1);
        sb += printLine('//', 1, 1);
        sb += printLine('// To configure generator, go to Settings/Extensions/JSON To Dart Model', 1, 1);
        sb += printLine('//', 1, 1);
        sb += printLine('// Add your json objects here separated by commas.', 1, 1);
        sb += printLine('// Note that you add class names to each object with key "__className":', 1, 1);
        sb += printLine('// And avoid duplicate class names in this list for best results.', 1, 1);
        sb += printLine('// FOR EXAMPLE:', 1, 1);
        sb += printLine('/*\n', 1, 1);
        sb += printLine('{', 1, 1);
        sb += printLine('"__className": "UserPost", // <- The base class name of the object.', 1, 2);
        sb += printLine('"userId": 1,', 1, 2);
        sb += printLine('"id": 1, // To mark as required value, change "id" to "r@id".', 1, 2);
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

    async getConfirmation(): Promise<boolean> {
        return window.showInformationMessage(
            'Start building JSON models?\n\nBuilds from file models.jsonc',
            { modal: true },
            ...["Start", "Don't ask again"]).then((action) => {
                switch (action) {
                    case "Don't ask again":
                        const config = workspace.getConfiguration('jsonToDart');
                        config.update('fastMode', true, true);
                        return true;
                    case "Start":
                        return true;
                    default:
                        return false;
                }
            });
    }
}

async function askForFileCreation(): Promise<boolean> {
    const text = 'models.jsonc file not found.'
        + '\n\n\Do you want it to be created for you?';
    return window.showInformationMessage(text, { modal: true }, ...["Add"])
        .then((action) => action === "Add" ? true : false);
}