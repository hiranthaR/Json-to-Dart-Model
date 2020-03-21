import {
    getTypeofProperty,
    isPremitiveType,
    mapTsTypeToDartType,
    isArray,
    isMap,
    isSameTypeInArray,
    getArrayItemType
} from "./lib";
import * as changeCase from "change-case";

export function getClassTemplate(className: string, obj: any): string {

    return `${
        Object.keys(obj)
            .filter(key => getTypeofProperty(obj[key], key) === "object")
            .map(key => `import './${changeCase.snakeCase(key.toLowerCase())}.dart';`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }

    class ${className}{
        ${
        Object.keys(obj)
            .map(key => `${mapTsTypeToDartType(getTypeofProperty(obj[key], key), key, obj[key])} ${changeCase.camelCase(key.toLowerCase())};`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }

        ${className}({
            ${
        Object.keys(obj)
            .map(key => `this.${changeCase.camelCase(key.toLowerCase())},`)
            .reduce((a, b) => `${a}${b}`, "")
        }        
        });

        ${className}.fromJson(Map<String, dynamic> json){
            ${
        Object.keys(obj)
            .map(key => mapInConstructor(obj[key], key))
            .reduce((a, b) => `${a}\n${b}`, "")
        }
        }
    }
    `;
}

function mapInConstructor(obj: any, key: string): string {
    if (isPremitiveType(getTypeofProperty(obj, key), key, obj)) {
        return `${changeCase.camelCase(key.toLowerCase())} = json['${key}'];`;
    } else {
        if (isArray(obj)) {
            if (isSameTypeInArray(obj, key)) {
                return `${changeCase.camelCase(key.toLowerCase())} = json['${key}'].cast<${getArrayItemType(obj, key)}>();`;
            } else {
                return "";
            }
        } else {
            return `${changeCase.camelCase(key.toLowerCase())} = json['${key}'] != null ? ${mapTsTypeToDartType(getTypeofProperty(obj, key), key, obj)}.fromJson(json['${key}']) : null;`;
        }
    }
}