import {
    getTypeofProperty
} from "./lib";
import * as changeCase from "change-case";

export function getClassTemplate(className: string, obj: any): string {

    return `${
        Object.keys(obj)
            .filter(key => getTypeofProperty(obj[key]) === "object")
            .map(key => `import './${changeCase.snakeCase(key.toLowerCase())}.dart;`)
            .reduce((a, b) => `${a}\n${b}`, "")
        }

    class ${className}{
        ${
        Object.keys(obj)
            .map(key => `${mapTsTypeToDartType(getTypeofProperty(obj[key]), key, obj[key])} ${changeCase.camelCase(key.toLowerCase())};`)
            .reduce((a, b) => `${a}\n${b}`)
        }
    }
    `;
}

function mapTsTypeToDartType(type: string, key: String, obj: any): string {
    const types: { [name: string]: string } = {
        "integer": "int",
        "string": "String",
        "object": changeCase.pascalCase(key.toLowerCase()),
        "map": `Map<String,String>`,
        "array": `List<String>`,
        "double": "double"
    };
    return types[type];
}