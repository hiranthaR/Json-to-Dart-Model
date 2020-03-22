import * as changeCase from "change-case";
import * as parse from "json-to-ast";
import {
    isArray,
} from "./lib";
import {
    ASTNode,
    ObjectNode,
    ArrayNode,
    LiteralNode

} from "json-to-ast";

const PRIMITIVE_TYPES: { [name: string]: boolean } = {
    'int': true,
    'double': true,
    'String': true,
    'bool': true,
    'DateTime': false,
    'List<DateTime>': false,
    'List<int>': true,
    'List<double>': true,
    'List<String>': true,
    'List<bool>': true,
    'Null': true,
};

function camelCase(text: string): string {
    return changeCase.camelCase(text);
}

function pascalCase(text: string): string {
    return changeCase.pascalCase(text);
}

function snakeCase(text: string): string {
    return changeCase.snakeCase(text);
}

function isPrimitiveType(typeName: string) {
    var isPrimitive = PRIMITIVE_TYPES[typeName];
    if (isPrimitive === null || isPrimitive === undefined) {
        return false;
    }
    return isPrimitive;
}

function fixFlieldName(name: string, isPrivate = false): string {
    var filedName = camelCase(name);
    if (isPrivate) {
        return `_${filedName}`;
    }
    return filedName;
}

function getTypeName(obj: any): string {
    var type = typeof obj + "";
    if (type === 'string') {
        return 'String';
    } else if (type === 'number') {
        return obj % 1 === 0 ? "int" : "double";
    } else if (type === "boolean") {
        return 'bool';
    } else if (obj === "undefined") {
        return 'Null';
    } else if (isArray(obj)) {
        return 'List';
    } else {
        // assumed class
        return 'Class';
    }
}

function navigateNode(astNode: ASTNode, path: string): ASTNode | undefined {
    let node: ASTNode | undefined;
    if (astNode.type === "Object") {
        var objectNode: ObjectNode = astNode as ObjectNode;
        var propertyNode = objectNode.children[0];
        if (propertyNode !== null) {
            propertyNode.key.value = path;
            node = propertyNode.value;
        }
    }
    if (astNode.type === "Array") {
        var arrayNode: ArrayNode = astNode as ArrayNode;
        var index = +path ?? null;
        if (index !== null && arrayNode.children.length > index) {
            node = arrayNode.children[index];
        }
    }
    return node;
}