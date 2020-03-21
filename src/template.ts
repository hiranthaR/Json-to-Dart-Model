import {
    getTypeofProperty,
    mapTsTypeToDartType
} from "./lib";
import * as changeCase from "change-case";

export function getClassTemplate(className: string, obj: any): string {

    return `${
        Object.keys(obj)
            .filter(key => getTypeofProperty(obj[key],key) === "object")
            .map(key => `import './${changeCase.snakeCase(key.toLowerCase())}.dart';`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }

    class ${className}{
        ${
        Object.keys(obj)
            .map(key => `${mapTsTypeToDartType(getTypeofProperty(obj[key],key), key, obj[key])} ${changeCase.camelCase(key.toLowerCase())};`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }
    }
    `;
}