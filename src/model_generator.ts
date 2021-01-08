import {
    ClassDefinition,
    Warning,
    TypeDefinition,
    typeDefinitionFromAny,
    newEmptyListWarn,
    newAmbiguousListWarn,
    WithWarning,
} from "./syntax";
import { navigateNode, camelCase, mergeObjectList, pascalCase } from "./helper";
import { ASTNode } from "json-to-ast";
import { isArray, parseJson } from "./lib";
import parse = require("json-to-ast");

class DartCode extends WithWarning<string> {
    constructor(result: string, warnings: Array<Warning>) {
        super(result, warnings);
    }
    getCode() { return this.result; }
}


class Hint {
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
                    typeDef = new TypeDefinition(hint.type, null, false, node);
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }
                if (typeDef.name === 'Class') {
                    typeDef.name = camelCase(key);
                }
                if (typeDef.name === 'List' && typeDef.subtype === 'Null') {
                    warnings.push(newEmptyListWarn(`${path}/${key}`));
                }
                if (typeDef.subtype !== null && typeDef.subtype === 'Class') {
                    typeDef.subtype = pascalCase(key);
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
                if (dependency.typeDef.name === 'List') {
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
                        toAnalyze.forEach((value: any, key: any) => (obj[key] = value));
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
            Array.from(fieldsKeys).forEach((f) => {
                var typeForField = c.fields.get(f);
                if (this.sameClassMapping.has(typeForField!!.name)) {
                    c.fields.get(f)!!.name = this.sameClassMapping.get(typeForField!!.name)!!;
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
