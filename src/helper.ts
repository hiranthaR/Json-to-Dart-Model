import * as changeCase from "change-case";
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

export function camelCase(text: string): string {
    return changeCase.camelCase(text);
}

export function pascalCase(text: string): string {
    return changeCase.pascalCase(text);
}

export function snakeCase(text: string): string {
    return changeCase.snakeCase(text);
}

export function isPrimitiveType(typeName: string) {
    var isPrimitive = PRIMITIVE_TYPES[typeName];
    if (isPrimitive === null || isPrimitive === undefined) {
        return false;
    }
    return isPrimitive;
}

export function fixFieldName(name: string, isPrivate = false): string {
    var filedName = camelCase(name);
    if (isPrivate) {
        return `_${filedName}`;
    }
    return filedName;
}

export function getTypeName(obj: any): string {
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

var _pattern = /([0-9]+)\.{0,1}([0-9]*)e(([-0-9]+))/g;

export function isASTLiteralDouble(astNode:ASTNode):boolean {
    if (astNode !== null && astNode.type === "Literal") {
      var literalNode:LiteralNode = astNode as LiteralNode;
      var containsPoint = literalNode.raw.includes('.');
      var containsExponent = literalNode.raw.includes('e');
      if (containsPoint || containsExponent) {
        var isDouble = containsPoint;
        if (containsExponent) {
          var matches = _pattern.test(literalNode.raw);
          if (matches !== null) {
              //TODO: need to fix
            // var integer = matches[1];
            // final comma = matches[2];
            // final exponent = matches[3];
            // isDouble = _isDoubleWithExponential(integer, comma, exponent);
          }
        }
        return isDouble;
      }
    }
    return false;
  }
  