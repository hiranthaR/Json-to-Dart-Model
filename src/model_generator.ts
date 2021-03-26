import { ClassDefinition, Warning, newEmptyListWarn, newAmbiguousListWarn, WithWarning, Dependency, } from "./syntax";
import { navigateNode, mergeObjectList, pascalCase, fixFieldName, camelCase, snakeCase, getObject } from "./helper";
import { TypeDefinition, typeDefinitionFromAny } from "./constructor";
import { ASTNode } from "json-to-ast";
import { isArray, parseJson } from "./lib";
import parse = require("json-to-ast");
import * as _ from "lodash";

class DartCode extends WithWarning<string> {
    constructor(result: string, warnings: Array<Warning>) {
        super(result, warnings);
    }
    getCode() { return this.result; }
}

export class Hint {
    path: string;
    type: string;

    constructor(path: string, type: string) {
        this.path = path;
        this.type = type;
    };
}

export class ModelGenerator {
    private _rootClassName: string;
    private _privateFields: boolean;
    private allClasses = new Array<ClassDefinition>();
    private allClassMapping = new Map<ClassDefinition, Dependency>();
    hints: Array<Hint>;

    constructor(rootClassName: string, privateFields = false, hints: Array<Hint> | null = null) {
        this._rootClassName = rootClassName;
        this._privateFields = privateFields;
        if (hints !== null) {
            this.hints = hints;
        } else {
            this.hints = new Array<Hint>();
        }
    }

    get duplicatesKeys() {
        const getName = (c: ClassDefinition): string => camelCase(c.name);
        const duplicatesOnly = (v: string, i: number, arr: string[]) => arr.indexOf(v) !== i;
        return this.allClasses.map(getName).filter(duplicatesOnly) || [];
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
            const _className = pascalCase(className)?.replace(/_/g, "");
            jsonRawData.forEach((value, key) => {
                var typeDef: TypeDefinition;
                var hint = this.hintForPath(`${path}/${key}`);
                var node = navigateNode(astNode, key);
                if (hint !== null && hint !== undefined) {
                    typeDef = new TypeDefinition(null, key, _className, null, hint.type, value, false, node);
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }
                typeDef.jsonKey = key;
                typeDef.name = fixFieldName(key, className);
                typeDef.value = value;
                typeDef.className = _className;
                if (typeDef.type !== null) {
                    if (!typeDef.isPrimitive) {
                        typeDef.updateImport(key);
                        const type = pascalCase(key)?.replace(/_/g, "");
                        if (typeDef.isList) {
                            typeDef.type = typeDef.type?.replace('Class', type);
                        } else {
                            typeDef.type = type;
                        }
                    }
                }
                if (typeDef.type === null) {
                    warnings.push(newEmptyListWarn(`${path}/${key}`));
                }
                if (typeDef.isAmbiguous) {
                    warnings.push(newAmbiguousListWarn(`${path}/${key}`));
                }
                classDefinition.addField(key, typeDef);
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

    private mergeDefinitions(arr: [ClassDefinition, Dependency][]) {
        arr.forEach(([cd, d], i) => {
            let paths = arr.map((c) => c[0].path);
            let count: any = {};
            if (paths.indexOf(cd.path) !== i) {
                let p = cd.path;
                let c = p in count ? count[p] = count[p] + 1 : count[p] = 1;
                let idx = c;
                // A class name for duplicate object.
                let prefix = snakeCase(d.typeDef.className) + "_";
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
        });
    }

    private definitionByDependence(dependency: Dependency): ClassDefinition | undefined {
        let classDef;
        classDef = this.allClasses.find(c => {
            if (dependency.typeDef.isList) {
                return c.hasPath(dependency.typeDef.importName!)
                    && c.hasValue(getObject(dependency.typeDef.value));
            } else {
                return c.hasPath(dependency.typeDef.importName!)
                    && c.hasValue(dependency.typeDef.value);
            }
        });
        if (classDef === undefined) {
            console.log(`ModelGenerator: definitionByDependence => found undefined object`);
        }
        return classDef;
    }

    private mergeSimilarDefinitions() {
         for (const definition of this.allClasses) {
            definition.dependencies.forEach((dependency) => {
                const classDef = this.definitionByDependence(dependency)!;
                if (classDef !== undefined) {
                    this.allClassMapping.set(classDef, dependency);
                }
            });
        };
        const definitions = Array.from(this.allClassMapping);
        definitions.sort((a, b) => a[0].name.localeCompare(b[0].name));
        this.mergeDefinitions(definitions);
    }

    /// generateUnsafeDart will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. The dart code is not validated so invalid dart code
    /// might be returned
    generateUnsafeDart(rawJson: string): Array<ClassDefinition> {
        var jsonRawData = parseJson(rawJson);
        var astNode = parse(rawJson, {
            loc: true,
            source: undefined
        });
        var warnings: Array<Warning> =
            this.generateClassDefinition(this._rootClassName, jsonRawData, "", astNode);
        // After generating all classes, merge similar classes with paths.
        //
        // If duplicates are detected create a new path.
        if (this.duplicatesKeys.length) {
            this.mergeSimilarDefinitions();
        }
        return this.allClasses;
    }

    /// generateDartClasses will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. If the generated dart is invalid it will throw an error.
    generateDartClasses(rawJson: string): Array<ClassDefinition> {
        rawJson = rawJson.split("null").join(`\"\"`);
        return this.generateUnsafeDart(rawJson);
    }
}
