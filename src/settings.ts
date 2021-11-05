import * as path from 'path';

import { Input } from './input';
import { snakeCase, toPosixPath } from './utils';

/** Separates class names and enhancement names from the syntax */
export class ClassNameModel {
    readonly enhancement: string = '';
    readonly directoryName: string;
    readonly fileName: string;
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
                this.enhancement = '.' + last.replace(/(\W|dart)+$/gm, '').split('.').map((e) => snakeCase(e)).join('.');
            } else {
                this.enhancement = last;
            }
        }
        this.directoryName = snakeCase(this.className);
        this.fileName = `${snakeCase(this.className)}${snakeCase(this.enhancement)}.dart`;
    }
}

/** Indicates where and how to create generated files. */
export enum TargetDirectoryType {
    /** 
     *  The generator generates all files to the map. The map name is as provided class name.
     */
    Compressed,
    /** 
     * Creates to the `models` folder.
     */
    Default,
    /** 
     * The generator does not generate files to the map. Creates them to the provided directory.
     */
    Expanded,
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
        case TargetDirectoryType.Compressed:
            const dir = path.join(settings.targetDirectory, snakeCase(settings.model.className));
            return toPosixPath(dir);
        case TargetDirectoryType.Default:
            const models = path.join(settings.targetDirectory, 'models');
            return toPosixPath(models);
        default:
            return toPosixPath(settings.targetDirectory);
    }
};