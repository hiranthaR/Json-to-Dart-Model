import { snakeCase } from "./helper";
import { Input } from "./input";

/** The indicates how the path was taken. */
export enum PathType {
    /** 
     *  The path type from the default options as from the settings or from the file `models.jsonc`.
     */
    Default,
    /** 
     * The path to the `models` folder from user input.
     */
    Standard,
    /** 
     * The raw path directly from the context.
     */
    Raw,
}

export interface ISettings {
    /**
     * Root class name.
     */
    className: string;
    /**
     * File target directory.
     */
    targetDirectory: string;
    /**
     * JSON object.
     */
    object: string;
    /**
     * User input.
     */
    input: Input;
    /**
     * The path input method type.
     */
    pathType: PathType;
}

export class Settings implements ISettings {
    className: string;
    targetDirectory: string;
    object: string;
    input: Input;
    pathType: PathType;

    constructor(settings: ISettings) {
        this.className = settings.className;
        this.object = settings.object;
        this.input = settings.input;
        this.pathType = settings.pathType;

        switch (settings.pathType) {
            case PathType.Default:
                this.targetDirectory = settings.targetDirectory + `/${snakeCase(settings.className)}`;
                break;
            case PathType.Standard:
                this.targetDirectory = settings.targetDirectory + `/models`;
                break;
            default:
                this.targetDirectory = settings.targetDirectory;
        }
    }
}