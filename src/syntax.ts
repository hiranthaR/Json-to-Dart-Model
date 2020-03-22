import {
    fixFieldName,
    isPrimitiveType,
    isASTLiteralDouble,
    getTypeName
} from "./helper";
import { ASTNode } from "json-to-ast";

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

export function typeDefinitionfromAny(obj: any, astNode: ASTNode) {
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
    return `new ${properType}.fromJson(${expression})`;
}