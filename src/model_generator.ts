import { ClassDefinition, Warning, newEmptyListWarn, newAmbiguousListWarn, WithWarning, } from "./syntax";
import { navigateNode, mergeObjectList, pascalCase, snakeCase, fixFieldName } from "./helper";
import { TypeDefinition, typeDefinitionFromAny } from "./constructor";
import { ASTNode } from "json-to-ast";
import { isArray, parseJson } from "./lib";
import parse = require("json-to-ast");

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
    private allClasses: Array<ClassDefinition> = new Array<ClassDefinition>();
    sameClassMapping: Map<string, string> = new Map<string, string>();
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

    /**
     * Returns only class names key for duplicates.
     */
    get duplicatesKeys(): string[] {
        const getKeys = (cd: ClassDefinition): string => snakeCase(cd.getName());
        const duplicatesOnly = (v: string, i: number, arr: string[]) => arr.indexOf(v) !== i;
        return this.allClasses.map(getKeys).filter(duplicatesOnly);
    }

    _hintForPath(path: string): Hint {
        return this.hints.filter((h) => h.path === path)[0];
    }

    _generateClassDefinition(
        className: string, jsonRawDynamicData: any, path: string, astNode: ASTNode): Array<Warning> {
        var warnings = new Array<Warning>();
        if (isArray(jsonRawDynamicData)) {
            // if first element is an array, start in the first element.
            var node = navigateNode(astNode, '0');
            this._generateClassDefinition(className, jsonRawDynamicData[0], path, node);
        } else {
            var jsonRawData: Map<any, any> = new Map(Object.entries(jsonRawDynamicData));
            var classDefinition = new ClassDefinition(pascalCase(className), this._privateFields);
            jsonRawData.forEach((value, key) => {
                var typeDef: TypeDefinition;
                var hint = this._hintForPath(`${path}/${key}`);
                var node = navigateNode(astNode, key);
                if (hint !== null && hint !== undefined) {
                    typeDef = new TypeDefinition(null, key, null, null, null, hint.type, value, false, node);
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }
                typeDef.jsonKey = key;
                typeDef.value = value;
                if (typeDef.type !== null) {
                    if (!typeDef.isPrimitive && !typeDef.isList) {
                        typeDef.constructorName = pascalCase(className).replace(/_/g, "");
                        typeDef.type = pascalCase(key).replace(/_/g, "");
                        typeDef.importName = key;
                        typeDef.name = fixFieldName(key, typeDef.constructorName);
                    } else {
                        typeDef.className = pascalCase(className).replace(/_/g, "");
                        typeDef.name = fixFieldName(key, typeDef.className);
                    }
                    if (typeDef.type === 'Class') {
                        typeDef.type = pascalCase(key);
                    }
                    if (typeDef.isList && !typeDef.isPrimitive) {
                        typeDef.type = typeDef.type.replace('Class', pascalCase(key));
                        typeDef.importName = key;
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
            var similarClass = this.allClasses.filter((cd) => cd === classDefinition)[0];
            if (similarClass !== null && similarClass !== undefined) {
                var similarClassName = similarClass.getName();
                var currentClassName = classDefinition.getName();
                this.sameClassMapping.set(currentClassName, similarClassName);
            } else {
                this.allClasses.push(classDefinition);
            }
            var dependencies = classDefinition.getDependencies();
            dependencies.forEach((dependency) => {
                var warns: Array<Warning>;
                if (dependency.typeDef.type !== null && dependency.typeDef.isList) {
                    // only generate dependency class if the array is not empty
                    if (jsonRawData.get(dependency.name).length > 0) {
                        // when list has ambiguous values, take the first one, otherwise merge all objects
                        // into a single one
                        var toAnalyze;
                        if (!dependency.typeDef.isAmbiguous) {
                            var mergeWithWarning = mergeObjectList(
                                jsonRawData.get(dependency.name), `${path}/${dependency.name}`);
                            toAnalyze = mergeWithWarning.result;
                            mergeWithWarning.warnings.forEach((wrn) => warnings.push(wrn));
                        } else {
                            toAnalyze = jsonRawData.get(dependency.name)[0];
                        }
                        const obj: any = {};
                        toAnalyze.forEach((value: any, key: any) => obj[key] = value);
                        var node = navigateNode(astNode, dependency.name);
                        warns = this._generateClassDefinition(dependency.getClassName(), obj, `${path}/${dependency.name}`, node);
                    }
                } else {
                    var node = navigateNode(astNode, dependency.name);
                    warns = this._generateClassDefinition(dependency.getClassName(),
                        jsonRawData.get(dependency.name), `${path}/${dependency.name}`, node);
                }
                if (warns!! !== null && warns!! !== undefined) {
                    warns!!.forEach(wrn => warnings.push(wrn));
                }
            });
        }

        return warnings;
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
            this._generateClassDefinition(this._rootClassName, jsonRawData, "", astNode);
        // after generating all classes, replace the omited similar classes.
        this.allClasses.forEach((c) => {
            var fieldsKeys = c.fields.keys();
            Array.from(fieldsKeys).forEach((key) => {
                var typeDef = c.fields.get(key);
                if (this.sameClassMapping.has(typeDef!!.name)) {
                    c.fields.get(key)!!.name = this.sameClassMapping.get(typeDef!!.name)!!;
                }
            });
        });
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
