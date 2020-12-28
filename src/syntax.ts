import { ASTNode } from "json-to-ast";
import {
  camelCase, fixFieldName,
  getTypeName, isASTLiteralDouble,
  isList, isPrimitiveType,
  pascalCase,
  snakeCase
} from "./helper";

export const emptyListWarn = "list is empty";
export const ambiguousListWarn = "list is ambiguous";
export const ambiguousTypeWarn = "type is ambiguous";

export class Warning {
  warning: string;
  path: string;

  constructor(warning: string, path: string) {
    this.warning = warning;
    this.path = path;
  }
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
  }
}

/**
 * Returns a string representation of a value obtained from a JSON
 * @param valueKey The key of the value in the JSON
 */
export function valueFromJson(valueKey: string): string {
  return `json['${valueKey}']`;
}

/**
 * Returns a string representation of a value beign assigned to a field/prop
 * @param key The field/prop name
 * @param value The value to assign to the field/prop
 */
export function joinAsClass(key: string, value: string): string {
  return `${key}: ${value},`;
}

export function jsonParseValue(
  key: string,
  typeDef: TypeDefinition
) {
  const jsonValue = valueFromJson(key);
  let formatedValue = '';
  if (typeDef.isPrimitive) {
    if (typeDef.name === "List") {
      formatedValue = `${jsonValue}.cast<${typeDef.subtype}>()`;
    } else {
      formatedValue = jsonValue;
    }
  } else if (typeDef.name === "List" && typeDef.subtype === "DateTime") {
    formatedValue = `${jsonValue}.map((v) => DateTime.tryParse(v));`;
  } else if (typeDef.name === "DateTime") {
    formatedValue = `DateTime.tryParse(${jsonValue});`;
  } else if (typeDef.name === "List") {
    // list of class
    formatedValue = `${jsonValue} != null ? ${jsonValue}.map((v) => ${typeDef.subtype === 'Null' ? 'v' : `${typeDef.subtype}.fromJson(v)` }).toList() : null`;
  } else {
    // class
    formatedValue = `${jsonValue} != null ? ${_buildParseClass(jsonValue, typeDef)} : null`;
  }
  return formatedValue;
}

export function toJsonExpression(
  key: string,
  typeDef: TypeDefinition,
  privateField: boolean,
  clz:string
): string {
  var fieldKey = fixFieldName(key,clz ,privateField);
  var thisKey = `${fieldKey}`;
  if (typeDef.isPrimitive) {
    return `data['${key}'] = ${thisKey};`;
  } else if (typeDef.name === "List") {
    // class list
    return `if (${thisKey}!= null) {
      data['${key}'] = ${thisKey}.map((v) => ${_buildToJsonClass(
      "v"
    )}).toList();
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

  constructor(
    name: string,
    subtype: string | null,
    isAmbiguous: boolean,
    astNode: ASTNode
  ) {
    this.name = name;
    this.subtype = subtype;
    this.isAmbiguous = isAmbiguous;
    if (subtype === null) {
      this.isPrimitive = isPrimitiveType(name);
      if (name === "int" && isASTLiteralDouble(astNode)) {
        this.name = "double";
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
  if (type === "List") {
    var list = obj;
    var elemType: string;
    if (list.length > 0) {
      elemType = getTypeName(list[0]);
      for (let listVal of list) {
        if (elemType !== getTypeName(listVal)) {
          isAmbiguous = true;
          break;
        }
      }
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
  return `${pascalCase(properType)}.fromJson(${expression})`;
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

  getName() {
    return this._name;
  }
  getPrivateFields() {
    return this._privateFields;
  }

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
  }

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
    return (
      Array.from(this.fields.keys()).filter(
        (k: string) => this.fields.get(k) === otherField
      ) !== null
    );
  }

  addField(name: string, typeDef: TypeDefinition) {
    this.fields.set(name, typeDef);
  }

  _addTypeDef(typeDef: TypeDefinition) {
    var sb = "";
    sb += isPrimitiveType(typeDef.name)
      ? `${typeDef.name}`
      : `${pascalCase(typeDef.name)}`;
    if (typeDef.subtype !== null) {
      if(typeDef.subtype === "Null"){
        sb += `<dynamic>`;
      } else{
        sb += `<${typeDef.subtype}>`;
      }
    }
    return sb;
  }

  private _fieldList(equatable: boolean = false): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        const fieldName = fixFieldName(key, this._name, this._privateFields);
        var sb = "\t"; 
        if (equatable) {
          sb += this._finalFieldKeyword();
        }
        sb += this._addTypeDef(value) + ` ${fieldName};`;
        return sb;
      })
      .join("\n");
  }

  private _fieldListCodeGen(equatable: boolean = false): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        const fieldName = fixFieldName(key, this._name, this._privateFields);
        var sb = "\t" + `@JsonKey(name: '${key}')\n`;
        sb += "\t";
        if (equatable) {
          sb += this._finalFieldKeyword();
        }
        sb += this._addTypeDef(value) + ` ${fieldName};`;
        return sb;
      })
      .join("\n");
  }
  
  private _equatableImport(): string {
    return "import 'package:equatable/equatable.dart';\n";
  }

  /**
   * Returns a list of props that equatable needs to work properly
   * @param print Whether the props should be printed or not
   */
  private equatablePropList(print: boolean = false): string {
    if (!print) {
      return '';
    }
    return `\t@override\n\tList<Object> get props => [\n\t\t${Array.from(this.fields.keys()).map((field) => `${fixFieldName(field, this._name, this._privateFields)}`).join(',\n\t\t')},\n\t];`;
  }

  private _finalFieldKeyword(): string {
    return 'final ';
  }

  private _importList(equatable: boolean = false): string {
    var imports = equatable ? this._equatableImport() : '';
    
    imports += Array.from(this.fields)
      .map(([key, value]) => {
        var sb = "";
        if (!isPrimitiveType(value.name) && !isList(value.name)) {
          sb = 'import "' + snakeCase(this._addTypeDef(value)) + `.dart";\n`;
        }
        if (
          value.subtype !== null &&
          isList(value.name) &&
          !isPrimitiveType(value.subtype)
        ) {
          sb = 'import "' + snakeCase(value.subtype) + `.dart";\n`;
        }
        return sb;
      })
      .join("");

    if (imports.length === 0) {
      return imports;
    } else {
      return imports + "\n";
    }
  }

  private _codeGenImportList(equatable: boolean = false): string {
    var imports = "import 'package:json_annotation/json_annotation.dart';\n";
    if (equatable) {
      imports += this._equatableImport();
    }

    imports += Array.from(this.fields)
      .map(([key, value]) => {
        var sb = "";
        if (!isPrimitiveType(value.name) && !isList(value.name)) {
          sb = 'import "' + snakeCase(this._addTypeDef(value)) + `.dart";\n`;
        }
        if (
          value.subtype !== null &&
          isList(value.name) &&
          !isPrimitiveType(value.subtype)
        ) {
          sb = 'import "' + snakeCase(value.subtype) + `.dart";\n`;
        }
        return sb;
      })
      .join("");

    imports += "\npart '" + snakeCase(this._name) + ".g.dart';\n\n";
    return imports;
  }

  _gettersSetters(): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        var publicFieldName = fixFieldName(key, this._name, false);
        var privateFieldName = fixFieldName(key, this._name, true);
        var sb = "";
        sb += "\t";
        sb += this._addTypeDef(value);
        sb += `get ${publicFieldName} => $privateFieldName;\n\tset ${publicFieldName}(`;
        sb += this._addTypeDef(value);
        sb += ` ${publicFieldName}) => ${privateFieldName} = ${publicFieldName};`;
        return sb;
      })
      .join("\n");
  }

  _defaultPrivateConstructor(): string {
    var sb = "";
    sb += `\tconst ${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, this._name, false);
      sb += this._addTypeDef(value);
      sb += ` ${publicFieldName}`;
      if (i !== len) {
        sb += ",\n\t\t";
      }
      i++;
    });
    sb += ",\n\t}) {\n";
    Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, this._name, false);
      var privateFieldName = fixFieldName(key,  this._name,true);
      sb += `this.${privateFieldName} = ${publicFieldName};\n`;
    });
    sb += "}";
    return sb;
  }
  _defaultConstructor(): string {
    var sb = "";
    sb += `\tconst ${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    Array.from(this.fields).map(([key, value]) => {
      var fieldName = fixFieldName(key, this._name, this._privateFields);
      sb += `this.${fieldName}`;
      if (i !== len) {
        sb += ",\n\t\t";
      }
      i++;
    });
    if(i == 0){
      sb += "});";
    }else{
      sb += ",\n\t});";
    }
    return sb;
  }

  _jsonParseFunc(): string {
    var sb = "";
    sb += `\tfactory ${this._name}`;
    sb += `.fromJson(Map<String, dynamic> json) {\n\t\treturn ${this._name}(\n`;
    sb += Array.from(this.fields).map(([key, value]) => {
      return `\t\t\t${joinAsClass(fixFieldName(key, this._name, this._privateFields), jsonParseValue(key, value))}`;
    }).join('\n');
    sb += "\n\t\t);\n\t}";
    return sb;
  }

  _jsonGenFunc(): string {
    var sb = "";
    sb +=
      "\tMap<String, dynamic> toJson() {\n\t\tfinal Map<String, dynamic> data = Map<String, dynamic>();\n";
    Array.from(this.fields).map(([key, value]) => {
      sb += `\t\t${toJsonExpression(key, value, this._privateFields,this._name)}\n`;
    });
    sb += "\t\treturn data;\n";
    sb += "\t}";
    return sb;
  }

  _codeGenJsonParseFunc(): string {
    return `\tfactory ${this._name}.fromJson(Map<String, dynamic> json) => _$${this._name}FromJson(json);`;
  }

  _codeGenJsonGenFunc(): string {
    return `\tMap<String, dynamic> toJson() => _$${this._name}ToJson(this);`;
  }

  toCodeGenString(equatable: boolean = false): string {
    if (this._privateFields) {
      return `${this._codeGenImportList(equatable)}@JsonSerializable()\nclass ${
        this._name
      } ${equatable ? 'extends Equatable ' : ''} {\n${this._fieldListCodeGen(equatable)}\n\n${this._defaultPrivateConstructor()}\n\n${this._gettersSetters()}\n\n${this._codeGenJsonParseFunc()}\n\n${this._codeGenJsonGenFunc()}\n\n${this.equatablePropList(equatable)}\n}\n`;
    } else {
      return `${this._codeGenImportList(equatable)}@JsonSerializable()\nclass ${
        this._name
      } ${equatable ? 'extends Equatable ' : ''} {\n${this._fieldListCodeGen(equatable)}\n\n${this._defaultConstructor()}\n\n${this._codeGenJsonParseFunc()}\n\n${this._codeGenJsonGenFunc()}\n\n${this.equatablePropList(equatable)}\n}\n`;
    }
  }

  toString(equatable: boolean = false): string {
    if (this._privateFields) {
      return `${this._importList(equatable)}class ${
        this._name
      } ${equatable ? 'extends Equatable ' : ''} {\n${this._fieldList(equatable)}\n\n${this._defaultPrivateConstructor()}\n\n${this._gettersSetters()}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}\n\n${this.equatablePropList(equatable)}\n}\n`;
    } else {
      return `${this._importList(equatable)}class ${
        this._name
      } ${equatable ? 'extends Equatable ' : ''} {\n${this._fieldList(equatable)}\n\n${this._defaultConstructor()}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}\n\n${this.equatablePropList(equatable)}\n}\n`;
    }
  }
}
