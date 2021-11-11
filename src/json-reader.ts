import { ConfigurationTarget, TextDocument, window } from 'vscode';
import { FileManager, hasObject } from './utils';
import { TargetDirectoryType } from './settings';
import { config } from './configuration';
import { jsonc } from 'jsonc';
import { transformFromFile } from './commands';

interface IJsonData {
    /** The type of the target directory. Indicates where and how files will be created. */
    targetDirectoryType: TargetDirectoryType;
    /** The workspace root */
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
}

enum LocationType { 'File', 'Directory', 'None' }
export type SafeData = [Error, JsonData] | [null, JsonData];
type JsonDataOptions = Pick<IJsonData, 'workspaceRoot' | 'defaultDirectory' | 'filename' | 'filePath' | 'value'>;

/**
 * A class that separates JSON object keys that have been added by the user.
 * And provides all information about the JSON object.
 */
export class JsonData implements IJsonData {
    // A key to determine the class name.
    private nameKey = '__className';
    // A key to determine the model target path.
    private pathKey = '__path';
    targetDirectoryType = TargetDirectoryType.Compressed;
    workspaceRoot: string | undefined;
    className?: string;
    requiredPath?: string;
    defaultDirectory: string;
    targetDirectory: string;
    filename: string;
    filePath: string;
    value: Record<string, any> = {};
    json: string;

    constructor(options: JsonDataOptions) {
        const { [this.nameKey]: name, [this.pathKey]: path, ...value } = options.value;
        this.className = name;
        this.requiredPath = path;
        this.value = value;
        this.json = JSON.stringify(value);
        this.filename = options.filename[0].match('/') ? options.filename.substr(1) : options.filename;
        this.filePath = options.filePath;
        this.workspaceRoot = options.workspaceRoot;
        this.defaultDirectory = options.defaultDirectory;
        this.targetDirectory = path !== undefined ?
            options.workspaceRoot + path :
            options.workspaceRoot + options.defaultDirectory;
        this.targetDirectoryType = path !== undefined || !hasObject(value) ?
            TargetDirectoryType.Expanded :
            TargetDirectoryType.Compressed;
    }
}

class JsonReader extends FileManager {
    private defaultDirectory: string;
    private fileName = '/models.jsonc';
    private dirName = '/.json_models';
    private length: number;

    constructor() {
        super();
        this.defaultDirectory = config.targetDirectory;
        this.length = this.allData.length;
    }

    get hasData() {
        return this.allData.length > 0;
    }

    private get filePath(): string {
        return this.workspaceRoot + this.fileName;
    }

    private get dirPath(): string {
        return this.workspaceRoot + this.dirName;
    }

    get existsSyncFile(): boolean {
        return this.existsSync(this.filePath);
    }

    get existsSyncDir(): boolean {
        return this.existsSync(this.dirPath);
    }

    get allData(): SafeData[] {
        const safeData: SafeData[] = [];
        const files = this.readDirectory(this.dirPath);

        if (this.existsSyncFile) {
            const json = this.readFile(this.filePath);
            const [err, result] = jsonc.safe.parse(json);

            if (err) {
                const options: JsonDataOptions = {
                    workspaceRoot: this.workspaceRoot,
                    defaultDirectory: this.defaultDirectory,
                    filename: this.fileName,
                    filePath: this.filePath,
                    value: {},
                };

                safeData.push([err, new JsonData(options)]);
            } else {
                if (result instanceof Array) {
                    for (let i = 0; i < result.length; i++) {
                        const object = result[i];
                        const options: JsonDataOptions = {
                            workspaceRoot: this.workspaceRoot,
                            defaultDirectory: this.defaultDirectory,
                            filename: this.fileName,
                            filePath: this.filePath,
                            value: object,
                        };

                        safeData.push([null, new JsonData(options)]);
                    }
                } else {
                    const options: JsonDataOptions = {
                        workspaceRoot: this.workspaceRoot,
                        defaultDirectory: this.defaultDirectory,
                        filename: this.fileName,
                        filePath: this.filePath,
                        value: result,
                    };

                    safeData.push([null, new JsonData(options)]);
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
                const json = this.readFile(path);
                const [err, result] = jsonc.safe.parse(json);

                if (err) {
                    const options: JsonDataOptions = {
                        workspaceRoot: this.workspaceRoot,
                        defaultDirectory: this.defaultDirectory,
                        filename: file,
                        filePath: path,
                        value: {},
                    };

                    safeData.push([err, new JsonData(options)]);
                } else {
                    if (result instanceof Array) {
                        for (let i = 0; i < result.length; i++) {
                            const object = result[i];
                            const options: JsonDataOptions = {
                                workspaceRoot: this.workspaceRoot,
                                defaultDirectory: this.defaultDirectory,
                                filename: file,
                                filePath: path,
                                value: object,
                            };

                            safeData.push([null, new JsonData(options)]);
                        }
                    } else {
                        const options: JsonDataOptions = {
                            workspaceRoot: this.workspaceRoot,
                            defaultDirectory: this.defaultDirectory,
                            filename: file,
                            filePath: path,
                            value: result,
                        };

                        safeData.push([null, new JsonData(options)]);
                    }
                }
            }
        }

        return safeData;
    }

    async createTrackingLocation(): Promise<void> {
        const gitignore = `${this.workspaceRoot}/.gitignore`;
        const error = 'Failed to create the tracking places';
        const createLocation = await promptForLocation();

        if (createLocation) {
            const locationType = await promptForLocationType();

            if (this.existsSync(gitignore)) {
                await updateGitignore(gitignore, this);
            }

            if (locationType === LocationType.File) {
                const info = 'models.jsonc file was created for the first time';
                this.writeFile(this.filePath, this.documentation, { showError: error, showInfo: info });
            } else if (locationType === LocationType.Directory) {
                if (!this.existsSyncDir) {
                    const info = `${this.dirName} directory was created for the first time`;
                    const path = `${this.dirPath}${this.fileName}`;

                    await this.createDirectory(this.dirPath);
                    this.writeFile(path, this.documentation, { showError: error, showInfo: info });
                }
            }
        }
    }

    async getConfirmation(): Promise<boolean> {
        return window.showInformationMessage(
            'Start building JSON models?\n\nBuilds from tracked file locations.',
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

async function promptForLocation(): Promise<boolean> {
    const text = 'No tracking file or directory found.\n\n\Do you want it to be created for you?';
    return window.showInformationMessage(text, { modal: true }, ...['Create'])
        .then((action) => action === 'Create' ? true : false);
}

async function promptForLocationType(): Promise<LocationType> {
    const text = 'How do you want to track your JSON files?.\n\n\Choose from the file or directory.';
    return window.showInformationMessage(text, { modal: true, }, ...['File', 'Directory'])
        .then((action) => {
            switch (action) {
                case 'File':
                    return LocationType.File;
                case 'Directory':
                    return LocationType.Directory;
            }

            return LocationType.None;
        });
}

async function updateGitignore(path: string, fm: FileManager): Promise<void> {
    const data = fm.readFile(path);
    const split = data.split('\n');
    const space = split.pop() === '' ? '' : '\n';
    const ignoredLocations = `${space}
# "JSON to Dart Model" generator tracker files locations.
/.json_models/
models.jsonc
`;

    if (!split.some((line) => line.match('.json_models') || line.match('models.jsonc'))) {
        const update = await promptForGitignorUpdate();

        if (update) {
            const err = 'The .gitignore file could not be updated.';
            const newData = `${data}${ignoredLocations}`;
            fm.writeFile(path, newData, { showError: err });
        }
    }
}

async function promptForGitignorUpdate(): Promise<boolean> {
    const text = 'Do you want to add JSON files to .gitignore?';
    return window.showInformationMessage(text, { modal: true }, ...['Add'])
        .then((action) => action === 'Add' ? true : false);
}

export const jsonReader = new JsonReader();