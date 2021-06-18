import { snakeCase } from "./helper";
import { Input } from "./input";

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
     * Indicates that settings are from the file directory.
     */
    isFromFile: boolean;
}

export class Settings implements ISettings {
    className: string;
    targetDirectory: string;
    object: string;
    input: Input;
    isFromFile: boolean;

    constructor(
        className: string,
        targetDirectory: string,
        object: string,
        input: Input,
        isFromFile: boolean = false,
    ) {
        this.className = className;
        this.targetDirectory = targetDirectory;
        this.object = object;
        this.input = input;
        this.isFromFile = isFromFile;
        if (isFromFile) {
            this.targetDirectory = `${targetDirectory}/${snakeCase(className)}`;
        } else {
            this.targetDirectory = `${targetDirectory}/models`;
        }
    }
}