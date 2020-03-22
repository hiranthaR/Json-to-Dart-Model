import {
    fixFieldName,
    isPrimitiveType,
    isASTLiteralDouble,
    getTypeName,
    camelCase,
    pascalCase,
} from "./helper";
import { ASTNode } from "json-to-ast";

export const emptyListWarn = "list is empty";
export const ambiguousListWarn = "list is ambiguous";
export const ambiguousTypeWarn = "type is ambiguous";

export class Warning {
    warning: string;
    path: string;

    constructor(warning: string, path: string) {
        this.warning = warning;
        this.path = path;
    };
}

export function newEmptyListWarn(path: string): Warning {
    return new Warning(emptyListWarn, path);
}

export function newAmbiguousListWarn(path: string): Warning {
    return new Warning(ambiguousListWarn, path);
}

export function newAmbiguousType(path: string): Warning {
    return new Warning(ambiguousTypeWarn, path);
}

export class WithWarning<T> {
    result: T;
    warnings: Array<Warning>;

    constructor(result: T, warnings: Array<Warning>) {
        this.result = result;
        this.warnings = warnings;
    };
}

export function jsonParseExpression(key: string, typeDef: TypeDefinition, isPrivate = false) {
    var jsonKey = `json['${key}']`;
    var fieldKey =
        fixFieldName(key, isPrivate);
    if (typeDef.isPrimitive) {
        if (typeDef.name === "List") {
            return `${fieldKey} = json['${key}'].cast<${typeDef.subtype}>();`;
        }
        return `${fieldKey} = json['${key}'];`;
    } else if (typeDef.name === "List" && typeDef.subtype === "DateTime") {
        return `${fieldKey} = json['${key}'].map((v) => DateTime.tryParse(v));`;
    } else if (typeDef.name === "DateTime") {
        return `${fieldKey} = DateTime.tryParse(json['${key}']);`;
    } else if (typeDef.name === 'List') {
        // list of class
        return `if (json['${key}'] != null) {\n\t\t\t${fieldKey} = new List<${typeDef.subtype}>();\n\t\t\tjson['${key}'].forEach((v) { ${fieldKey}.add(new ${typeDef.subtype}.fromJson(v)); });\n\t\t}`;
    } else {
        // class
        return `${fieldKey} = json['${key}'] != null ? ${_buildParseClass(jsonKey, typeDef)} : null;`;
    }
}

export function toJsonExpression(key: string, typeDef: TypeDefinition, privateField: boolean): string {
    var fieldKey =
        fixFieldName(key, privateField);
    var thisKey = `this.${fieldKey}`;
    if (typeDef.isPrimitive) {
        return `data['${key}'] = ${thisKey};`;
    } else if (typeDef.name === 'List') {
        // class list
        return `if (${thisKey}!= null) {
      data['${key}'] = ${thisKey}.map((v) => ${_buildToJsonClass('v')}).toList();
    }`;
    } else {
        // class
        return `if (${thisKey} != null) {
      data['${key}'] = ${_buildToJsonClass(thisKey)};
    }`;
    }
}

export class TypeDefinition {
    name: string;
    subtype: string | null;
    isAmbiguous = false;
    isPrimitive = false;

    constructor(name: string, subtype: string | null, isAmbiguous: boolean, astNode: ASTNode) {
        this.name = name;
        this.subtype = subtype;
        this.isAmbiguous = isAmbiguous;
        if (subtype === null) {
            this.isPrimitive = isPrimitiveType(name);
            if (name === 'int' && isASTLiteralDouble(astNode)) {
                this.name = 'double';
            }
        } else {
            this.isPrimitive = isPrimitiveType(`${name}<${subtype}>`);
        }
        if (isAmbiguous === null) {
            isAmbiguous = false;
        }
    }

}

export function typeDefinitionFromAny(obj: any, astNode: ASTNode) {
    var isAmbiguous = false;
    var type = getTypeName(obj);
    if (type === 'List') {
        var list = obj;
        var elemType: string;
        if (list.length > 0) {
            elemType = getTypeName(list[0]);
            for (let listVal of list) {
                if (elemType !== getTypeName(listVal)) {
                    isAmbiguous = true;
                    break;
                }
            };
        } else {
            // when array is empty insert Null just to warn the user
            elemType = "Null";
        }
        return new TypeDefinition(type, elemType, isAmbiguous, astNode);
    }
    return new TypeDefinition(type, null, isAmbiguous, astNode);
}

function _buildToJsonClass(expression: string): string {
    return `${expression}.toJson()`;
}

function _buildParseClass(expression: string, typeDef: TypeDefinition): string {
    var properType = typeDef.subtype !== null ? typeDef.subtype : typeDef.name;
    return `new ${pascalCase(properType)}.fromJson(${expression})`;
}

class Dependency {
    name: string;
    typeDef: TypeDefinition;

    constructor(name: string, typeDef: TypeDefinition) {
        this.name = name;
        this.typeDef = typeDef;
    }

    getClassName(): string {
        return camelCase(this.name);
    }
}

export class ClassDefinition {
    private _name: string;
    private _privateFields: boolean;
    fields: Map<string, TypeDefinition> = new Map<string, TypeDefinition>();

    getName() { return this._name; }
    getPrivateFields() { return this._privateFields; }

    getDependencies(): Array<Dependency> {
        var dependenciesList = new Array<Dependency>();
        var keys = this.fields.keys();
        for (let [key, value] of this.fields) {
            if (!value.isPrimitive) {
                dependenciesList.push(new Dependency(key, value));
            }
        }
        return dependenciesList;
    }

    constructor(name: string, privateFields = false) {
        this._name = name;
        this._privateFields = privateFields;
    };

    //     bool operator == (other) {
    //     if (other is ClassDefinition) {
    //         ClassDefinition otherClassDef = other;
    //         return this.isSubsetOf(otherClassDef) && otherClassDef.isSubsetOf(this);
    //     }
    //     return false;
    // }

    // bool isSubsetOf(ClassDefinition other) {
    //     final List < String > keys = this.fields.keys.toList();
    //     final int len = keys.length;
    //     for (int i = 0; i < len; i++) {
    //         TypeDefinition otherTypeDef = other.fields[keys[i]];
    //         if (otherTypeDef != null) {
    //             TypeDefinition typeDef = this.fields[keys[i]];
    //             if (typeDef != otherTypeDef) {
    //                 return false;
    //             }
    //         } else {
    //             return false;
    //         }
    //     }
    //     return true;
    // }

    hasField(otherField: TypeDefinition) {
        return Array.from(this.fields.keys())
            .filter((k: string) => this.fields.get(k) === otherField) !==
            null;
    }

    addField(name: string, typeDef: TypeDefinition) {
        this.fields.set(name, typeDef);
    }

    _addTypeDef(typeDef: TypeDefinition) {
        var sb = "";
        sb += isPrimitiveType(typeDef.name) ? `${typeDef.name}`:`${pascalCase(typeDef.name)}`;
        if (typeDef.subtype !== null) {
            sb += (`<${typeDef.subtype}>`);
        }
        return sb;
    }

    private _fieldList(): string {
        return Array.from(this.fields).map(([key, value]) => {
            const fieldName = fixFieldName(key, this._privateFields);
            var sb = "\t" + this._addTypeDef(value) + ` ${fieldName};`;
            return sb;
        }).join('\n');
    }

    _gettersSetters(): string {
        return Array.from(this.fields).map(([key, value]) => {
            var publicFieldName =
                fixFieldName(key, false);
            var privateFieldName =
                fixFieldName(key, true);
            var sb = "";
            sb += '\t';
            sb += this._addTypeDef(value);
            sb += `get ${publicFieldName} => $privateFieldName;\n\tset ${publicFieldName}(`;
            sb += this._addTypeDef(value);
            sb += ` ${publicFieldName}) => ${privateFieldName} = ${publicFieldName};`;
            return sb;
        }).join('\n');
    }

    _defaultPrivateConstructor(): string {
        var sb = "";
        sb += `\t${this._name}({`;
        var i = 0;
        var len = Array.from(this.fields.keys()).length - 1;
        Array.from(this.fields).map(([key, value]) => {
            var publicFieldName =
                fixFieldName(key, false);
            sb += this._addTypeDef(value);
            sb += ` ${publicFieldName}`;
            if (i !== len) {
                sb += ", ";
            }
            i++;
        });
        sb += '}) {\n';
        Array.from(this.fields).map(([key, value]) => {
            var publicFieldName =
                fixFieldName(key, false);
            var privateFieldName =
                fixFieldName(key, true);
            sb += `this.${privateFieldName} = ${publicFieldName};\n`;
        });
        sb += '}';
        return sb;
    }
    _defaultConstructor(): string {
        var sb = "";
        sb += `\t${this._name}({`;
        var i = 0;
        var len = Array.from(this.fields.keys()).length - 1;
        Array.from(this.fields).map(([key, value]) => {
            var fieldName =
                fixFieldName(key, this._privateFields);
            sb += `this.${fieldName}`;
            if (i !== len) {
                sb += ', ';
            }
            i++;
        });
        sb += '});';
        return sb;
    }

    _jsonParseFunc(): string {
        var sb = "";
        sb += `\t${this._name}`;
        sb += `.fromJson(Map<String, dynamic> json) {\n`;
        Array.from(this.fields).map(([key, value]) => {
            sb += `\t\t${jsonParseExpression(key, value, this._privateFields)}\n`;
        });
        sb += '\t}';
        return sb;
    }

    _jsonGenFunc(): string {
        var sb = "";
        sb +=
            '\tMap<String, dynamic> toJson() {\n\t\tfinal Map<String, dynamic> data = new Map<String, dynamic>();\n';
        Array.from(this.fields).map(([key, value]) => {
            sb += `\t\t${toJsonExpression(key, value, this._privateFields)}\n`;
        });
        sb += '\t\treturn data;\n';
        sb += '\t}';
        return sb;
    }

    toString(): string {
        if (this._privateFields) {
            return `class ${this._name} {\n${this._fieldList()}\n\n${this._defaultPrivateConstructor()}\n\n${this._gettersSetters()}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}\n}\n`;
        } else {
            return `class ${this._name} {\n${this._fieldList()}\n\n${this._defaultConstructor()}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}\n}\n`;
        }
    }
}
