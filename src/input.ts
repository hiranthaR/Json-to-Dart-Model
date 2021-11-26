import {
    promptForCodecs,
    promptForCodeGenerator,
    promptForCopyWithMethod,
    promptForEqualityOperator,
    promptForFromAndToSuffix,
    promptForImmutableClass,
    promptForToStringMethod
} from './shared';
import { config } from './configuration';
import { pascalCase } from './utils';

/** To string method type */
export enum ToStringMethod {
    Default = 'Default',
    Auto = 'Auto',
    Stringify = 'Stringify',
    Dart = 'Dart',
}
/** Equality method type */
export enum Equality {
    Default = 'Default',
    Equatable = 'Equatable',
    Dart = 'Dart',
}
/** Supported code generators */
export enum CodeGenerator {
    Default = 'Default',
    JSON = 'JSON',
    Freezed = 'Freezed',
}

interface InputProperties {
    codeGenerator: CodeGenerator;
    immutable: boolean;
    toString: ToStringMethod;
    copyWith: boolean;
    equality: Equality;
    nullSafety: boolean;
    /**
     * Required root path. [workspace.workspaceFolders![0].uri.path] 
     */
    targetDirectory?: string;
    runBuilder: boolean;
    primaryConfiguration: boolean;
    fastMode: boolean;
    sortConstructorsFirst: boolean;
    includeIfNull: boolean;
    fromAndToSuffix: string;
    avoidDynamicTypes: boolean;
    jsonCodecs: boolean;
}

/**
 * The class which provide all user inputs.
 */
export class Input implements InputProperties {
    codeGenerator: CodeGenerator;
    immutable: boolean;
    toString: ToStringMethod;
    copyWith: boolean;
    equality: Equality;
    nullSafety: boolean;
    targetDirectory: string;
    runBuilder: boolean;
    primaryConfiguration: boolean;
    fastMode: boolean;
    sortConstructorsFirst: boolean;
    includeIfNull: boolean;
    fromAndToSuffix: string;
    avoidDynamicTypes: boolean;
    jsonCodecs: boolean;

    constructor(props?: InputProperties) {
        this.codeGenerator = props?.codeGenerator ?? config.codeGenerator;
        this.immutable = props?.immutable ?? config.immutable;
        this.toString = props?.toString ?? config.toString;
        this.copyWith = props?.copyWith ?? config.copyWith;
        this.equality = props?.equality ?? config.equality;
        this.nullSafety = props?.nullSafety ?? config.nullSafety;
        this.targetDirectory = props?.targetDirectory ?? config.targetDirectory;
        this.runBuilder = props?.runBuilder ?? config.runBuilder;
        this.primaryConfiguration = props?.primaryConfiguration ?? config.primaryConfiguration;
        this.fastMode = props?.fastMode ?? config.fastMode;
        this.sortConstructorsFirst = props?.sortConstructorsFirst ?? config.sortConstructorsFirst;
        this.includeIfNull = props?.includeIfNull ?? config.includeIfNull;
        this.avoidDynamicTypes = props?.avoidDynamicTypes ?? config.avoidDynamicTypes;
        this.jsonCodecs = props?.jsonCodecs ?? config.jsonCodecs;
        const suffix = props?.fromAndToSuffix ?? config.fromAndToSuffix;
        this.fromAndToSuffix = pascalCase(suffix);
    }

    get isImmutable(): boolean {
        return this.equality === 'Equatable' || this.immutable;
    }

    get generate(): boolean {
        return this.freezed || this.serializable;
    }

    get equatable(): boolean {
        return this.equality === 'Equatable';
    }

    get freezed(): boolean {
        return this.codeGenerator === CodeGenerator.Freezed;
    }

    get serializable(): boolean {
        return this.codeGenerator === CodeGenerator.JSON;
    }

    get isAutoOrStringify(): boolean {
        return this.equatable && this.toString === 'Auto' || this.equatable && this.toString === 'Stringify';
    }

    get isAutoOrToStringMethod(): boolean {
        return !this.equatable && this.toString === 'Auto' || !this.equatable && this.toString === 'Dart';
    }
}

/**
 * UI elements to show messages, selections, and asking for user input.
 * @generate indicates whether selected code generator.
 */
export const getUserInput = async (generate: boolean = false): Promise<Input> => {
    const input = new Input();

    input.runBuilder = config.runBuilder;

    if (generate) {
        input.codeGenerator = await promptForCodeGenerator();

        if (input.freezed) {
            input.nullSafety = config.nullSafety;
        }
    }
    // Freezed supports all the methods and you do not have to ask the user about the rest.
    if (!input.freezed) {
        input.equality = await promptForEqualityOperator();

        if (input.equality !== 'Equatable') {
            input.immutable = await promptForImmutableClass();
        }

        const isEquatable = input.equality === 'Equatable';
        input.toString = await promptForToStringMethod(isEquatable);
        input.copyWith = await promptForCopyWithMethod();

        if (!input.generate) {
            const fromAndToSuffix = await promptForFromAndToSuffix();
            const suffix = fromAndToSuffix?.trim();
            input.fromAndToSuffix = !suffix && !suffix?.length ?
                config.fromAndToSuffix :
                pascalCase(suffix);
            input.jsonCodecs = await promptForCodecs();
        }

        input.nullSafety = config.nullSafety;
    }

    return input;
};