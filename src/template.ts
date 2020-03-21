import {
    getTypeofProperty,
    isPremitiveType,
    mapTsTypeToDartType
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
            .map(key => `${changeCase.camelCase(key.toLowerCase())} = json['${key}'];`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }
        }
    }
    `;
}