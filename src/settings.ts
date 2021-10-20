import { Input } from './input';
import { snakeCase } from './utils';

/** Separates class names and enhancement names from the syntax */
export class ClassNameModel {
    readonly nameEnhancement: string = '';
    className: string;

    constructor(className: string) {
        if (!className.match(/\W/gm)) {
            this.className = className;
        } else {
            const split = className.split(/\W{1,}/gm);
            const first = split.shift() ?? className;
            const last = '.' + split.join('.').split('.').map((e) => snakeCase(e)).join('.');
            this.className = first;
            if (last.match(/(\W|dart)+$/gm)) {
                this.nameEnhancement = '.' + last.replace(/(\W|dart)+$/gm, '').split('.').map((e) => snakeCase(e)).join('.');
            } else {
                this.nameEnhancement = last;
            }
        }
    }
}

/** The indicates how the path was taken. */
export enum TargetDirectoryType {
    /** 
     *  The generator generates all files to the map. The map name is as provided class name.
     */
    Default,
    /** 
     * The path to the `models` folder from user input.
     */
    Standard,
    /** 
     * The generator does not generate files to the map.
     */
    Raw,
}

export interface ISettings {
    /**
     * Class definition model. Required root class name.
     */
    model: ClassNameModel;
    /**
     * File target directory.
     */
    targetDirectory: string;
    /**
     * A valid JSON.
     */
    json: string;
    /**
     * User input.
     */
    input: Input;
    /**
     * The path input method type.
     */
    targetDirectoryType: TargetDirectoryType;
}

export class Settings implements ISettings {
    model: ClassNameModel;
    targetDirectory: string;
    json: string;
    input: Input;
    targetDirectoryType: TargetDirectoryType;

    constructor(settings: ISettings) {
        this.model = settings.model;
        this.json = settings.json;
        this.input = settings.input;
        this.targetDirectoryType = settings.targetDirectoryType;
        this.targetDirectory = buildTargetDirectory(settings);
    }
}

const buildTargetDirectory = (settings: ISettings): string => {
    switch (settings.targetDirectoryType) {
        case TargetDirectoryType.Default:
            return settings.targetDirectory + `/${snakeCase(settings.model.className)}`;
        case TargetDirectoryType.Standard:
            return settings.targetDirectory + '/models';
        default:
            return settings.targetDirectory;
    }
};