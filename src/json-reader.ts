import * as fs from 'fs';

import { ConfigurationTarget, TextDocument, window } from 'vscode';
import { getWorkspaceRoot, hasObjects } from './utils';
import { TargetDirectoryType } from './settings';
import { config } from './configuration';
import { jsonc } from 'jsonc';
import { transformFromFile } from './commands';

export type SafeData = [Error, JsonData] | [null, JsonData];
type DirType = Pick<JsonData, 'workspaceRoot' | 'defaultDirectory' | 'filename' | 'filePath'>;

/**
 * A class that separates JSON object keys that have been added by the user.
 * And provides all information about the JSON object.
 */
export class JsonData {
    // A key to determine the class name.
    private nameKey = '__className';
    // A key to determine the model target path.
    private pathKey = '__path';
    targetDirectoryType = TargetDirectoryType.Default;
    workspaceRoot: string | undefined;
    /** A class name from the JSON object. */
    className?: string;
    /** Required path by the user from the JSON object. */
    requiredPath?: string;
    /** The default destination directory from the settings. */
    defaultDirectory: string;
    /** The target directory to tell the generator where create the file. */
    targetDirectory: string;
    /** A file name with included type. */
    filename: string;
    /** The file location. */
    filePath: string;
    /** A JSON object without option keys `__className` and `__path` added by the user. */
    value: Record<string, any>;
    /** JSON string strictly ready for conversion. */
    json: string;

    constructor(dir: DirType, object: Record<string, any> = {}) {
        const { [this.nameKey]: name, [this.pathKey]: path, ...obj } = object;
        this.className = name;
        this.requiredPath = path;
        this.value = obj;
        this.json = JSON.stringify(obj);
        this.filename = dir.filename[0].match('/') ? dir.filename.substr(1) : dir.filename;
        this.filePath = dir.filePath;
        this.workspaceRoot = dir.workspaceRoot;
        this.defaultDirectory = dir.defaultDirectory;
        this.targetDirectory = path !== undefined ?
            dir.workspaceRoot + path :
            dir.workspaceRoot + dir.defaultDirectory;
        this.targetDirectoryType = path !== undefined || !hasObjects(obj) ?
            TargetDirectoryType.Raw :
            TargetDirectoryType.Default;
    }
}

class JsonReader {
    private defaultDirectory: string;
    private fileName = '/models.jsonc';
    private dirName = '/.json_models';
    private length: number;

    constructor() {
        this.defaultDirectory = config.targetDirectory;
        this.length = this.allData.length;
    }

    get hasData() {
        return this.allData.length > 0;
    }

    get workspaceRoot() {
        return getWorkspaceRoot();
    }

    private get filePath(): string {
        return this.workspaceRoot + this.fileName;
    }

    private get dirPath(): string {
        return this.workspaceRoot + this.dirName;
    }

    private get readDir(): string[] {
        try {
            return fs.readdirSync(this.dirPath, 'utf-8');
        } catch (_) {
            return [];
        }
    }

    get existsSyncFile(): boolean {
        return fs.existsSync(this.filePath);
    }

    get existsSyncDir(): boolean {
        return fs.existsSync(this.dirPath);
    }

    get allData(): SafeData[] {
        const safeData: SafeData[] = [];
        const files = this.readDir;

        if (this.existsSyncFile) {
            const json = fs.readFileSync(this.filePath, 'utf-8');
            const [err, result] = jsonc.safe.parse(json);

            if (err) {
                const dir: DirType = {
                    workspaceRoot: this.workspaceRoot,
                    defaultDirectory: this.defaultDirectory,
                    filename: this.fileName,
                    filePath: this.filePath,
                };
                safeData.push([err, new JsonData(dir)]);
            } else {
                if (result instanceof Array) {
                    for (let i = 0; i < result.length; i++) {
                        const object = result[i];
                        const dir: DirType = {
                            workspaceRoot: this.workspaceRoot,
                            defaultDirectory: this.defaultDirectory,
                            filename: this.fileName,
                            filePath: this.filePath,
                        };
                        safeData.push([null, new JsonData(dir, object)]);
                    }
                } else {
                    const dir: DirType = {
                        workspaceRoot: this.workspaceRoot,
                        defaultDirectory: this.defaultDirectory,
                        filename: this.fileName,
                        filePath: this.filePath,
                    };
                    safeData.push([null, new JsonData(dir, result)]);
                }
            }
        }

        if (!this.existsSyncDir) {
            return safeData;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = this.dirPath + `/${file}`;

            if (file.endsWith('.jsonc') || file.endsWith('.json')) {
                const json = fs.readFileSync(path, 'utf-8');
                const [err, result] = jsonc.safe.parse(json);

                if (err) {
                    const dir: DirType = {
                        workspaceRoot: this.workspaceRoot,
                        defaultDirectory: this.defaultDirectory,
                        filename: file,
                        filePath: path,
                    };
                    safeData.push([err, new JsonData(dir)]);
                } else {
                    if (result instanceof Array) {
                        for (let i = 0; i < result.length; i++) {
                            const object = result[i];
                            const dir: DirType = {
                                workspaceRoot: this.workspaceRoot,
                                defaultDirectory: this.defaultDirectory,
                                filename: file,
                                filePath: path,
                            };
                            safeData.push([null, new JsonData(dir, object)]);
                        }
                    } else {
                        const dir: DirType = {
                            workspaceRoot: this.workspaceRoot,
                            defaultDirectory: this.defaultDirectory,
                            filename: file,
                            filePath: path,
                        };
                        safeData.push([null, new JsonData(dir, result)]);
                    }
                }
            }
        }

        return safeData;
    }

    async createFile(): Promise<void> {
        const text = 'models.jsonc file was created for the first time';
        const errText = 'Failed to create the model.jsonc file';
        const accepted = await askForFileCreation();
        if (accepted) {
            fs.writeFile(this.filePath, this.documentation, 'utf8', (err) => {
                if (err) {
                    window.showErrorMessage(errText);
                    console.error(err);
                    return;
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
            ...['Start', "Don't ask again"]).then((action) => {
                switch (action) {
                    case "Don't ask again":
                        config.setConfig<boolean>('fastMode', true, ConfigurationTarget.Global);
                        return true;
                    case 'Start':
                        return true;
                    default:
                        return false;
                }
            });
    }

    onChange(document: TextDocument) {
        if (this.hasData) {
            if (document.fileName.endsWith('/models.jsonc') ||
                document.uri.path.match(`${this.dirName}/`) !== null &&
                document.languageId === 'jsonc' ||
                document.uri.path.match(`${this.dirName}/`) !== null &&
                document.languageId === 'json'
            ) {
                const len = this.allData.length;
                let i = 0;

                while (i < len) {
                    const err = this.allData[i][0];
                    if (err) { break; }
                    ++i;
                }

                while (this.length !== len) {
                    transformFromFile();
                    this.length = len;
                }
            };
        }
    }

    private get documentation() {
        return `// GENERATED BY JSON TO DART MODEL
[
    // Useful links to work with this file:
    // About jsonc: https://github.com/onury/jsonc
    // Try jsonc: https://komkom.github.io
    //
    // To configure generator, go to Settings/Extensions/JSON To Dart Model
    //
    // Add your json objects here separated by commas.
    // Note that you add class names to each object with key "__className":
    // And avoid duplicate class names in this list for best results.
    // FOR EXAMPLE:
    /*
    // Uncomment this to test and run builder with Shift + Ctrl + Alt + B
    {	
        // To add enhancemed name to all generated files add new name after dot.
        // Example: user_post.model. Result: user_post.model.dart
        "__className": "user_post", // <- The base class name of the object.
        // It's possible to override the default path with a new one by adding "__path" key.
        // - it's useful if you want split your models to different workspace directories.
        "__path": "/lib/models/user", // <- this is not required.
        "userId": 1,
        "id": 1, // To mark as required value, change "id" to "r@id".
        "title": "Json To Dart Model", // To mark as a default value, change "title" to "d@title".
        "body": "Json to Dart advanced..."
        // Force new type by adding new one after dot.
        // Note: it works only with not primitive values.
        // "type": {...} // <- Example: "type.post_type". Result: PostType type;
    }

    */
]`;
    }
}

async function askForFileCreation(): Promise<boolean> {
    const text = 'models.jsonc file not found.'
        + '\n\n\Do you want it to be created for you?';
    return window.showInformationMessage(text, { modal: true }, ...['Add'])
        .then((action) => action === 'Add' ? true : false);
}

export const jsonReader = new JsonReader();