import { ClassDefinition, Warning, newEmptyListWarn, newAmbiguousListWarn, WithWarning, Dependency, } from "./syntax";
import { navigateNode, mergeObjectList, pascalCase, fixFieldName } from "./helper";
import { TypeDefinition, typeDefinitionFromAny } from "./constructor";
import { ASTNode } from "json-to-ast";
import { isArray, parseJson } from "./lib";
import parse = require("json-to-ast");
import * as _ from "lodash";
import { ISettings } from "./settings";

class DartCode extends WithWarning<string> {
    constructor(result: string, warnings: Array<Warning>) {
        super(result, warnings);
    }
    getCode() { return this.result; }
}

/**
 * A function that cleans all annotations added by user to JSON key.
 * @param {string} key a key to be processed.
 * @returns string value.
 */
const cleanKey = (key: string): string => {
    const search = /([^]@)/gi;
    const replace = "";
    return key.replace(search, replace);
};

export class Hint {
    path: string;
    type: string;

    constructor(path: string, type: string) {
        this.path = path;
        this.type = type;
    };
}

export class ModelGenerator {
    private _settings: ISettings;
    private _rootClassName: string;
    private _privateFields: boolean;
    private allClasses = new Array<ClassDefinition>();
    private allClassMapping = new Map<ClassDefinition, Dependency>();
    hints: Array<Hint>;

    constructor(
        settings: ISettings,
        privateFields = false,
        hints: Array<Hint> | null = null
    ) {
        this._settings = settings;
        this._rootClassName = settings.className;
        this._privateFields = privateFields;
        if (hints !== null) {
            this.hints = hints;
        } else {
            this.hints = new Array<Hint>();
        }
    }

    get duplicates(): ClassDefinition[] {
        const getPath = (c: ClassDefinition): string => c.path;
        const duplicatesOnly = (v: string, i: number, arr: string[]) => arr.indexOf(v) !== i;
        const paths = this.allClasses.map(getPath).filter(duplicatesOnly) || [];
        return this.allClasses.filter((c) => paths.includes(c.path)) || [];
    }

    private hintForPath(path: string): Hint {
        return this.hints.filter((h) => h.path === path)[0];
    }

    private generateClassDefinition(
        className: string, jsonRawDynamicData: any, path: string, astNode: ASTNode): Array<Warning> {
        var warnings = new Array<Warning>();
        if (isArray(jsonRawDynamicData)) {
            // if first element is an array, start in the first element.
            var node = navigateNode(astNode, '0');
            this.generateClassDefinition(className, jsonRawDynamicData[0], path, node);
        } else {
            var jsonRawData: Map<any, any> = new Map(Object.entries(jsonRawDynamicData));
            var classDefinition = new ClassDefinition(className, this._privateFields);
            const _className = pascalCase(className);
            jsonRawData.forEach((value, key) => {
                var typeDef: TypeDefinition;
                var hint = this.hintForPath(`${path}/${cleanKey(key)}`);
                var node = navigateNode(astNode, cleanKey(key));
                if (hint !== null && hint !== undefined) {
                    typeDef = new TypeDefinition(
                        null, key, _className, null, hint.type, value, false, node
                    );
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }

                const name = typeDef.filteredKey(key);

                typeDef.name = fixFieldName(name, className);
                typeDef.value = value;
                typeDef.prefix = _className;
                if (typeDef.type !== null) {
                    if (!typeDef.isPrimitive) {
                        typeDef.updateImport(name);
                        const type = pascalCase(name);
                        if (typeDef.isList) {
                            typeDef.type = typeDef.type?.replace('Class', type);
                        } else {
                            typeDef.type = type;
                        }
                    }
                }
                if (typeDef.type === null) {
                    warnings.push(newEmptyListWarn(`${path}/${name}`));
                }
                if (typeDef.isAmbiguous) {
                    warnings.push(newAmbiguousListWarn(`${path}/${name}`));
                }
                classDefinition.addField(name, typeDef);
            });
            this.allClasses.push(classDefinition);
            var dependencies = classDefinition.dependencies;
            dependencies.forEach((dependency) => {
                var warns: Array<Warning>;
                if (dependency.typeDef.type !== null && dependency.typeDef.isList) {
                    // only generate dependency class if the array is not empty
                    if (dependency.typeDef.value.length > 0) {
                        // when list has ambiguous values, take the first one, otherwise merge all objects
                        // into a single one
                        var toAnalyze;
                        if (!dependency.typeDef.isAmbiguous) {
                            var mergeWithWarning = mergeObjectList(
                                dependency.typeDef.value, `${path}/${dependency.name}`
                            );
                            toAnalyze = mergeWithWarning.result;
                            mergeWithWarning.warnings.forEach((wrn) => warnings.push(wrn));
                        } else {
                            toAnalyze = dependency.typeDef.value[0];
                        }
                        const obj: any = {};
                        toAnalyze.forEach((value: any, key: any) => obj[key] = value);
                        var node = navigateNode(astNode, dependency.name);
                        warns = this.generateClassDefinition(dependency.className, obj, `${path}/${dependency.name}`, node);
                    }
                } else {
                    var node = navigateNode(astNode, dependency.name);
                    warns = this.generateClassDefinition(dependency.className,
                        jsonRawData.get(dependency.name), `${path}/${dependency.name}`, node);
                }
                if (warns!! !== null && warns!! !== undefined) {
                    warns!!.forEach(wrn => warnings.push(wrn));
                }
            });
        }

        return warnings;
    }

    private async mergeDefinitions(arr: [ClassDefinition, Dependency][]) {
        for (let i = 0; i < arr.length; i++) {
            let cd = arr[i][0];
            let d = arr[i][1];
            let paths = arr.map((c) => c[0].path);
            let count: any = {};

            if (paths.indexOf(cd.path) !== i) {
                let p = cd.path;
                let c = p in count ? count[p] = count[p] + 1 : count[p] = 1;
                let idx = c;
                // A class name for duplicate object.
                let prefix = d.typeDef.prefix + "_";
                let path = prefix + p;

                if (paths.indexOf(path) === -1) {
                    cd.updatePath(path);
                    d.typeDef.updateImport(path);
                }

                while (paths.indexOf(path) !== -1) {
                    //If it continues to duplicate, add index.
                    path = prefix + p + `_${idx++}`;
                };
                // Create file path for objects.
                cd.updatePath(path);
                // Navigate object to file.
                d.typeDef.updateImport(path);
            }
        }
    }

    /** Returns class definition equal to the dependency. */
    private async sortByDependency(dependency: Dependency): Promise<ClassDefinition | undefined> {
        let classDef;
        const path = dependency.typeDef.importName;
        const value = dependency.typeDef.value;
        // TODO: fix anotations keys
        classDef = this.allClasses.find((c) => {
            if (path === null) {
                return false;
            };

            return c.hasPath(path) && c.hasValue(value);
        });
        if (classDef === undefined) {
            console.log(`ModelGenerator: sortByDependency => found undefined object`);
        }
        return classDef;
    }

    /** Returns one definition by all dependencies */
    private getDuplicatesByDependency(
        dependency: Dependency,
        callbackfn: (classDefinition: ClassDefinition, dependency: Dependency, index: number) => void
    ) {
        for (let i = 0; i < this.allClasses.length; i++) {
            const c = this.allClasses[i];
            const field = dependency.typeDef;
            const value = dependency.typeDef.value;

            if (c.hasField(field) && c.hasEqualField(value)) {
                return callbackfn(c, dependency, i);
            }
        }
    }

    private updateDependecies(key: ClassDefinition, dependency: Dependency) {
        for (const c of this.allClasses) {
            for (const d of c.dependencies) {
                const path = dependency.typeDef.importName;
                const value = dependency.typeDef.value;
                const prefix = this.allClassMapping.get(key)?.typeDef.prefix + '_';

                if (d.typeDef.importName === path && d.typeDef.hasValue(value)) {
                    d.typeDef.updateImport(prefix + path);
                }
            }
        }
    }

    private async handleDuplicates() {
        for await (const definition of this.allClasses) {
            for (const dependency of definition.dependencies) {
                const classDef = await this.sortByDependency(dependency);
                if (classDef !== undefined) {
                    if (this.duplicates.includes(classDef)) {
                        this.getDuplicatesByDependency(dependency, (c, d, i) => {
                            const paths = this.allClasses.map((cd) => cd.path);

                            if (!this.allClassMapping.has(c)) {
                                this.allClassMapping.set(c, d);
                            }

                            if (paths.indexOf(c.path) !== i) {
                                // Update all existing dependencies.
                                this.updateDependecies(c, d);
                            }
                        });
                    } else {
                        this.allClassMapping.set(classDef, dependency);
                    }
                }
            }
        };

        const definitions = Array.from(this.allClassMapping);
        definitions.sort((a, b) => a[0].name.localeCompare(b[0].name));
        this.mergeDefinitions(definitions);
    }

    /// generateUnsafeDart will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. The dart code is not validated so invalid dart code
    /// might be returned
    private async generateUnsafeDart(rawJson: string): Promise<Array<ClassDefinition>> {
        var jsonRawData = parseJson(rawJson);
        var astNode = parse(rawJson, {
            loc: true,
            source: undefined
        });
        var warnings: Array<Warning> = this.generateClassDefinition(
            this._rootClassName, jsonRawData, "", astNode
        );
        // After generating all classes, merge similar classes with paths.
        //
        // If duplicates are detected create a new path.
        if (this.duplicates.length) {
            await this.handleDuplicates();
            return Array.from(this.allClassMapping.keys());
        } else {
            return this.allClasses;
        }
    }

    /// generateDartClasses will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. If the generated dart is invalid it will throw an error.
    generateDartClasses(rawJson: string): Promise<Array<ClassDefinition>> {
        return this.generateUnsafeDart(rawJson);
    }
}