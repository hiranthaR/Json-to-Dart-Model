import {
  fixFieldName,
  isPrimitiveType,
  isASTLiteralDouble,
  getTypeName,
  camelCase,
  pascalCase,
  snakeCase,
  isList,
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
      formatedValue = `${jsonValue} as List<${typeDef.subtype}>`;
    } else {
      formatedValue = `${jsonValue} as ${typeDef.name}`;
    }
  } else if (typeDef.name === "List" && typeDef.subtype === "DateTime") {
    formatedValue = `${jsonValue}.map((v) => DateTime.tryParse(v));`;
  } else if (typeDef.name === "DateTime") {
    formatedValue = `DateTime.tryParse(${jsonValue});`;
  } else if (typeDef.name === "List") {
    // list of class
    formatedValue = `(${jsonValue} as List<${typeDef.subtype}>)?.map((e) {\n\t\t\t\treturn e == null ? null : ${typeDef.subtype}.fromJson(e as Map<String, dynamic>);\n\t\t\t})?.toList()`;
  } else {
    // class
    formatedValue = `${jsonValue} == null\n\t\t\t\t\t? null\n\t\t\t\t\t: ${_buildParseClass(jsonValue, typeDef)}`;
  }
  return formatedValue;
}

export function toJsonExpression(
  key: string,
  obj: string,
  typeDef: TypeDefinition,
  privateField: boolean
): string {
  var fieldKey = fixFieldName(key, privateField);
  var thisKey = `${fieldKey}`;
  if (typeDef.isPrimitive) {
    return `'${key}': ${obj},`;
  } else if (typeDef.name === "List") {
    // class list
    // return `if (${thisKey}!= null) {
    //   data['${key}'] = ${thisKey}.map((v) => ${_buildToJsonClass(
    //   "v"
    // )}).toList();
    // }`;

    //return `${key} : ${thisKey},`;

    return `'${key}': ${thisKey}?.map((e) => ${_buildToJsonClass("e")})?.toList(),`;

  } else {
    // class
    return `'${key}': ${_buildToJsonClass(thisKey)},`;
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
      // Returns any value if not defined.
      elemType = "dynamic";
    }
    return new TypeDefinition(type, elemType, isAmbiguous, astNode);
  }
  return new TypeDefinition(type, null, isAmbiguous, astNode);
}

function _buildToJsonClass(expression: string): string {
  return `${expression}?.toJson()`;
}

function _buildParseClass(expression: string, typeDef: TypeDefinition): string {
  var properType = typeDef.subtype !== null ? typeDef.subtype : typeDef.name;
  return `${pascalCase(properType)}.fromJson(${expression} as Map<String, dynamic>)`;
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

  /**
   * Returns new value name if it reserved by the system.
   * @param value will be same if it not reserved by system.
   */
  _objectName(value: string): string {
    var isReserved = value == 'get';
    return isReserved ? `${value}${this._name}` : value;
  }

  _addTypeDef(typeDef: TypeDefinition) {
    var sb = "";
    sb += isPrimitiveType(typeDef.name)
      ? `${typeDef.name}`
      : `${pascalCase(typeDef.name)}`;
    if (typeDef.subtype !== null) {
      sb += `<${typeDef.subtype}>`;
    }
    return sb;
  }

  private _fieldList(equatable: boolean = false): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        const fieldName = fixFieldName(key, this._privateFields);
        var sb = "\t";
        if (equatable) {
          sb += this._finalFieldKeyword();
        }
        sb += this._addTypeDef(value) + ` ${this._objectName(fieldName)};`;
        return sb;
      })
      .join("\n");
  }

  private _fieldListCodeGen(equatable: boolean = false): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        const fieldName = fixFieldName(key, this._privateFields);
        var sb = "\t" + `@JsonKey(name: '${key}')\n`;
        sb += "\t";
        if (equatable) {
          sb += this._finalFieldKeyword();
        }
        sb += this._addTypeDef(value) + ` ${this._objectName(fieldName)};`;
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
    const expressionBody = `\n\n\t@override\n\tList<Object> get props => [${Array.from(this.fields.keys()).map((field) => `${fixFieldName(this._objectName(field), this._privateFields)}`).join(', ')}];`.replace(' ]', ']');
    const blockBody = `\n\n\t@override\n\tList<Object> get props {\n\t\treturn [\n\t\t\t${Array.from(this.fields.keys()).map((field) => `${fixFieldName(this._objectName(field), this._privateFields)}`).join(',\n\t\t\t')},\n\t\t];\n\t}`;
    var isShort = expressionBody.length < 87;

    if (!print) {
      return '';
    } else {
      return isShort ? expressionBody : blockBody;
    }
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
      .sort().join("");

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
      .sort().join("");

    imports += "\npart '" + snakeCase(this._name) + ".g.dart';\n\n";
    return imports;
  }

  _gettersSetters(): string {
    return Array.from(this.fields)
      .map(([key, value]) => {
        var publicFieldName = fixFieldName(key, false);
        var privateFieldName = fixFieldName(key, true);
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
    sb += `\t${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, false);
      sb += this._addTypeDef(value);
      sb += ` ${this._objectName(publicFieldName)}`;
      if (i !== len) {
        sb += ", ";
      }
      i++;
    });
    sb += "}) {\n";
    Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, false);
      var privateFieldName = fixFieldName(key, true);
      sb += `this.${this._objectName(privateFieldName)} = ${this._objectName(publicFieldName)};\n`;
    });
    sb += "}";
    return sb;
  }

  _defaultConstructor(equatable: boolean = false): string {
    var sb = "";
    sb += equatable ? `\tconst ${this._name}({` : `\t${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    var isShort = len !== i && len < 3;
    Array.from(this.fields).map(([key, value]) => {
      var fieldName = fixFieldName(key, this._privateFields);
      sb += isShort ? `this.${this._objectName(fieldName)}` : `\n\t\tthis.${this._objectName(fieldName)},`;
      if (isShort) sb += ", ";
      i++;
    });
    sb += isShort ? "});" : "\n\t});";
    return isShort ? sb.replace(", });", "});") : sb;
  }

  _jsonParseFunc(): string {
    var sb = "";
    sb += `\tfactory ${this._name}`;
    sb += `.fromJson(Map<String, dynamic> json) {\n\t\treturn ${this._name}(\n`;
    sb += Array.from(this.fields).map(([key, value]) => {
      return `\t\t\t${joinAsClass(fixFieldName(this._objectName(key), this._privateFields), jsonParseValue(key, value))}`;
    }).join('\n');
    sb += "\n\t\t);\n\t}";
    return sb;
  }

  _jsonGenFunc(): string {
    var sb = "";
    sb += "\tMap<String, dynamic> toJson() {\n\t\treturn {\n";
    Array.from(this.fields).map(([key, value]) => {
      sb += `\t\t\t${toJsonExpression(key, this._objectName(key), value, this._privateFields)}\n`;
    });
    sb += "\t\t};\n";
    sb += "\t}";
    return sb;
  }

  _codeGenJsonParseFunc(): string {
    const expressionBody = `\tfactory ${this._name}.fromJson(Map<String, dynamic> json) => _$${this._name}FromJson(json);`;
    const blockBody = `\tfactory ${this._name}.fromJson(Map<String, dynamic> json) {\n\t\treturn _$${this._name}FromJson(json);\n\t}`;

    return expressionBody.length > 78 ? blockBody : expressionBody;
  }

  _codeGenJsonGenFunc(): string {
    const expressionBody = `\tMap<String, dynamic> toJson() => _$${this._name}ToJson(this);`;
    const blockBody = `\tMap<String, dynamic> toJson() {\n\t\treturn _$${this._name}ToJson(this);\n\t}`;

    return expressionBody.length > 78 ? blockBody : expressionBody;
  }

  /**
   * Generate copyWith(); mehtod for easier work with immutable classes.
   * @param copyWith method should be generated or not.
   */
  _copyWithMethod(copyWith: boolean = false): string {
    if (!copyWith) return '';

    const className = this._name;

    var sb = "";
    sb += `\n\n\t${className} copyWith({`;
    // Constructor objects.
    for (let [key, value] of this.fields) {
      var fieldName = fixFieldName(key, this._privateFields);
      sb += `\n\t\t${this._addTypeDef(value)} ${this._objectName(fieldName)},`;
    }

    sb += "\n\t}) {";
    sb += `\n\t\treturn ${className}(`
    // Return constructor.
    for (let [key, _] of this.fields) {
      var fieldName = fixFieldName(key, this._privateFields);
      sb += `\n\t\t\t${this._objectName(fieldName)}: ${this._objectName(fieldName)} ?? this.${this._objectName(fieldName)},`;
    }

    sb += "\n\t\t);";
    sb += "\n\t\}";

    return sb;
  }

  toCodeGenString(equatable: boolean = false, copyWith: boolean = false): string {
    if (this._privateFields) {
      return `${this._codeGenImportList(equatable)}@JsonSerializable()\nclass ${this._name
        }${equatable ? ' extends Equatable' : ''} {\n${this._fieldListCodeGen(equatable)}\n\n${this._defaultPrivateConstructor()}${this._copyWithMethod(copyWith)}\n\n${this._gettersSetters()}\n\n${this._codeGenJsonParseFunc()}\n\n${this._codeGenJsonGenFunc()}${this.equatablePropList(equatable)}\n}\n`;
    } else {
      return `${this._codeGenImportList(equatable)}@JsonSerializable()\nclass ${this._name
        }${equatable ? ' extends Equatable' : ''} {\n${this._fieldListCodeGen(equatable)}\n\n${this._defaultConstructor(equatable)}${this._copyWithMethod(copyWith)}\n\n${this._codeGenJsonParseFunc()}\n\n${this._codeGenJsonGenFunc()}${this.equatablePropList(equatable)}\n}\n`;
    }
  }

  toString(equatable: boolean = false, copyWith: boolean = false): string {
    if (this._privateFields) {
      return `${this._importList(equatable)}class ${this._name
        }${equatable ? ' extends Equatable' : ''} {\n${this._fieldList(equatable)}\n\n${this._defaultPrivateConstructor()}\n\n${this._gettersSetters()}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}${this._copyWithMethod(copyWith)}${this.equatablePropList(equatable)}\n}\n`;
    } else {
      return `${this._importList(equatable)}class ${this._name
        }${equatable ? ' extends Equatable' : ''} {\n${this._fieldList(equatable)}\n\n${this._defaultConstructor(equatable)}\n\n${this._jsonParseFunc()}\n\n${this._jsonGenFunc()}${this._copyWithMethod(copyWith)}${this.equatablePropList(equatable)}\n}\n`;
    }
  }
}
