import {
  fixFieldName,
  isPrimitiveType,
  isASTLiteralDouble,
  getTypeName,
  camelCase,
  pascalCase,
  snakeCase,
  isList,
  filterListType,
  getListSubtype,
} from "./helper";
import { ASTNode } from "json-to-ast";
import { Input } from "./input";

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
 * Prints a string to a line.
 * @param print string that will be printed.
 * @param newLine force to the next line.
 * @param tabs how many tabs will be added.
 */
const printLine = (print: string, newLine = false, tabs = 0): string => {
  var sb = '';
  sb += newLine ? '\n' : '';
  for (let i = 0; i < tabs; i++) {
    sb += '\t';
  }
  sb += print;
  return sb;
};

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

export function jsonParseValue(key: string, typeDef: TypeDefinition) {
  const jsonValue = valueFromJson(key);
  let formatedValue = '';
  if (typeDef.isPrimitive) {
    if (typeDef.name === 'List') {
      formatedValue = `${jsonValue} as ${typeDef.subtype}`;
    } else if (typeDef.name === 'DateTime') {
      if (typeDef.subtype !== null && isList(typeDef.subtype)) {
        const result = filterListType(typeDef.subtype);
        formatedValue += printLine(`(${jsonValue} as List)`);
        for (let i = 0; i < result.length - 1; i++) {
          var index = i * 2;
          formatedValue += printLine(`?.map((e) => (e as List)`, true, 5 + index);
        }
        formatedValue += printLine(`?.map((e) => e == null ? null : DateTime.parse(e as String))`, true, 3 + 2 * result.length);
        for (let i = 0; i < result.length - 1; i++) {
          var index = i * 2;
          formatedValue += printLine(`?.toList())`, true, 3 + 2 * result.length - index);
        }
        formatedValue += printLine(`?.toList()`, true, 5);
      } else {
        formatedValue = `${jsonValue} == null ? null : DateTime.parse(${jsonValue} as String)`;
      }
    } else {
      formatedValue = `${jsonValue} as ${typeDef.name}`;
    }
  } else if (typeDef.name === "List" && typeDef.subtype === "DateTime") {
    formatedValue += printLine(`(${jsonValue} as List)`);
    formatedValue += printLine(`?.map((e) => e == null ? null : DateTime.parse(e as String))`, true, 5);
    formatedValue += printLine(`?.toList()`, true, 5);
  } else if (typeDef.name === "DateTime") {
    formatedValue = `DateTime.tryParse(${jsonValue});`;
  } else if (typeDef.subtype !== null && !typeDef.isPrimitive) {
    // Responsive farmatting.
    // List of List Classes (List<List.......<Class>>)
    // This will generate deeply nested infinity list depending on how many lists are in the lists.
    const result = filterListType(typeDef.subtype);
    formatedValue = printLine(`(${jsonValue} as ${typeDef.name})`);
    for (let i = 0; i < result.length - 1; i++) {
      var index = i * 2;
      formatedValue += printLine(`?.map((e) => (e as ${typeDef.name})`, true, 5 + index);
    }
    formatedValue += printLine(`?.map((e) => e == null`, true, 3 + 2 * result.length);
    formatedValue += printLine(`? null`, true, 5 + 2 * result.length);
    formatedValue += printLine(`: ${_buildParseClass(key, jsonValue)})`, true, 5 + 2 * result.length);
    for (let i = 0; i < result.length - 1; i++) {
      var index = i * 2;
      formatedValue += printLine(`?.toList())`, true, 3 + 2 * result.length - index);
    }
    formatedValue += printLine(`?.toList()`, true, 5);
  } else {
    // Class
    formatedValue += printLine(`${jsonValue} == null`);
    formatedValue += printLine(`? null`, true, 5);
    formatedValue += printLine(`: ${_buildParseClass(key, jsonValue)}`, true, 5);
  }
  return formatedValue;
}

export function toJsonExpression(
  key: string,
  obj: string,
  typeDef: TypeDefinition,
  privateField: boolean
): string {
  var fieldKey = fixFieldName(key, obj, privateField);
  var thisKey = `${fieldKey}`;
  if (typeDef.isPrimitive) {
    if (typeDef.name === "DateTime") {
      if (typeDef.subtype !== null) {
        const result = filterListType(typeDef.subtype);
        // Responsive formatting.
        var sb = '';
        sb += printLine(`'${key}': ${thisKey}`);
        sb += Array.from(result).map(_ => printLine('?.map((l) => l')).slice(0, -1).join('');
        sb += printLine(`?.map((e) => e?.toIso8601String())`);
        sb += Array.from(result).map(_ => printLine('?.toList())')).slice(0, -1).join('');
        sb += printLine('?.toList(),');
        return sb;
      } else {
        return `'${key}': ${thisKey}?.toIso8601String(),`;
      }
    } else {
      return `'${key}': ${thisKey},`;
    }
  } else if (typeDef.subtype !== null) {
    // List of List Classes 
    if (isList(typeDef.subtype)) {
      const result = filterListType(typeDef.subtype);

      var sb = '';
      sb += printLine(`'${key}': ${thisKey}`);
      // Responsive formatting.
      // This will generate infiniti maps depending on how many lists are in the lists.
      // By default this line starts with keyword List, slice will remove it.
      sb += Array.from(result).map(_ => printLine('?.map((l) => l')).slice(0, -1).join('');
      sb += printLine(`?.map((e) => ${_buildToJsonClass("e")})`);
      sb += Array.from(result).map(_ => printLine('?.toList())')).slice(0, -1).join('');
      sb += printLine('?.toList(),');
      return sb;
    } else {
      return `'${key}': ${thisKey}?.map((e) => ${_buildToJsonClass("e")})?.toList(),`;
    }
  } else {
    // Class
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
      this.isPrimitive = isPrimitiveType(subtype);
    }
    if (isAmbiguous === null) {
      isAmbiguous = false;
    }
  }
}

export function typeDefinitionFromAny(obj: any, astNode: ASTNode) {
  var isAmbiguous = false;
  var type: string = getTypeName(obj);

  if (type === "List") {
    var list = obj;
    var elemType: string = getListSubtype(list);
    if (elemType !== getListSubtype(list)) {
      isAmbiguous = true;
    }
    return new TypeDefinition(type, elemType, isAmbiguous, astNode);
  }
  return new TypeDefinition(type, null, isAmbiguous, astNode);
}

function _buildToJsonClass(expression: string): string {
  return `${expression}?.toJson()`;
}

function _buildParseClass(className: string, expression: string) {
  const _className = className.replace(/_/g, "");
  return `${pascalCase(_className)}.fromJson(${expression} as Map<String, dynamic>)`;
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
    for (let [key, value] of this.fields) {
      if (!value.isPrimitive) {
        dependenciesList.push(new Dependency(key, value));
      }
    }
    return dependenciesList;
  }

  /**
   * The class for syntax printing.
   * This feature removes all dashes from names to avoid lint warning.
   * @param {string} className a class name to force override default name.
   * @returns {string} by default return name from the ClassDefinition.
   */
  getClassName(className: string = ""): string {
    if (className.length > 0) {
      return pascalCase(className)?.replace(/_/g, "");
    } else {
      return pascalCase(this._name)?.replace(/_/g, "");
    }
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
    if (isList(typeDef.name) || typeDef.name === 'DateTime' && typeDef.subtype !== null) {
      sb += typeDef.subtype;
    } else {
      sb += isPrimitiveType(typeDef.name) ? typeDef.name : this.getClassName(typeDef.name);
    }
    return sb;
  }

  private _fieldList(immutable: boolean = false): string {
    return Array.from(this.fields).map(([key, value]) => {
      const fieldName = fixFieldName(key, this._name, this._privateFields);
      var sb = "\t";
      if (immutable) {
        sb += this._finalFieldKeyword(true);
      }
      sb += this._addTypeDef(value) + ` ${fieldName};`;
      return sb;
    }).join("\n");
  }

  private _fieldListCodeGen(immutable: boolean = false): string {
    return Array.from(this.fields).map(([key, value]) => {
      const fieldName = fixFieldName(key, this._name, this._privateFields);
      var sb = "\t" + `@JsonKey(name: '${key}')\n`;
      sb += "\t";
      if (immutable) {
        sb += this._finalFieldKeyword(true);
      }
      sb += this._addTypeDef(value) + ` ${fieldName};`;
      return sb;
    }).join("\n");
  }

  /**
   * Advanced abstract class with immutable values and objects.
   * @param freezed class should be printed or not.
   */
  private _freezedField(): string {
    var sb = "";
    sb += printLine("@freezed");
    sb += printLine(`abstract class ${this.getClassName()} with `, true);
    sb += printLine(`_$${this.getClassName()} {`);
    sb += printLine(`const factory ${this.getClassName()}({`, true, 1);
    for (var [key, value] of this.fields) {
      const fieldName = fixFieldName(key, this._name, this._privateFields);
      sb += printLine(`@JsonKey(name: "${key}")`, true, 2);
      sb += printLine(` ${this._addTypeDef(value)} ${fieldName},`);
    };
    sb += printLine(`}) = _${this.getClassName()};\n\n`, true, 1);
    sb += printLine(`${this._codeGenJsonParseFunc(true)}`);
    sb += printLine("}", true);
    return sb;
  }


  /**
   * Returns a list of props that equatable needs to work properly
   * @param print Whether the props should be printed or not
   */
  private equatablePropList(print: boolean = false): string {
    var expressionBody = `\n\n\t@override\n\tList<Object> get props => [`
      + `${Array.from(this.fields.keys()).map((field) => `${fixFieldName(field, this._name, this._privateFields)}`).join(', ')}];`.replace(' ]', ']');
    var blockBody = `\n\n\t@override\n\tList<Object> get props {\n\t\treturn [\n\t\t\t`
      + `${Array.from(this.fields.keys()).map((field) => `${fixFieldName(field, this._name, this._privateFields)}`).join(',\n\t\t\t')},\n\t\t];\n\t}`;
    var isShort = expressionBody.length < 87;

    if (!print) {
      return '';
    } else {
      return isShort ? expressionBody : blockBody;
    }
  }

  /**
   * Keyword "final" to mark that object are immutable.
   * @param immutable should print the keyword or not
   */
  private _finalFieldKeyword(immutable: boolean = false): string {
    return immutable ? 'final ' : '';
  }

  /**
   * Keyword "const" to mark that class or object are immutable.
   * @param immutable should print the keyword or not.
   */
  private _constFieldKeyword(immutable: boolean = false): string {
    return immutable ? 'const ' : '';
  }

  /**
   * All imports from the Dart library.
   * @param input should print the keyword or not.
   */
  private _dartImportsList(input: Input): string {
    var imports = "";

    var len = Array.from(this.fields).length;
    // If less two hashcode values do not need import dart:ui.
    if (len > 1) {
      imports += input.equality ? "import 'dart:ui';\n" : "";
    }

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  };

  /**
   * All imports from the packages library.
   * @param input should print the keyword or not.
   */
  private _packageImportsList(input: Input): string {
    var imports = "";
    // Sorted alphabetically for effective dart style.
    imports += input.equatable ? "import 'package:equatable/equatable.dart';\n" : "";
    imports += input.immutable && !input.generate ? "import 'package:flutter/foundation.dart';\n" : "";
    imports += input.generate && !input.freezed ? `import 'package:json_annotation/json_annotation.dart';\n` : "";
    imports += input.freezed ? "import 'package:freezed_annotation/freezed_annotation.dart';\n" : "";

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  };

  private _partImportsList(input: Input): string {
    var imports = "";
    imports += input.freezed ? "part '" + snakeCase(this._name) + ".freezed.dart';\n" : "";
    imports += input.generate ? "part '" + snakeCase(this._name) + ".g.dart';\n" : "";
    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  }

  private _importList(): string {
    var imports = "";

    imports += Array.from(this.fields).map(([key, value]) => {
      var sb = "";
      if (!value.isPrimitive && !isList(value.name)) {
        sb = 'import "' + snakeCase(key) + `.dart";\n`;
      }
      if (value.subtype !== null && !value.isPrimitive) {
        if (isList(value.subtype)) {
          sb = 'import "' + snakeCase(key) + `.dart";\n`;
        } else {
          sb = 'import "' + snakeCase(value.subtype) + `.dart";\n`;
        }
      }
      return sb;
    }).sort().join("");

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  }

  _gettersSetters(): string {
    return Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, this._name, false);
      var privateFieldName = fixFieldName(key, this._name, true);
      var sb = "";
      sb += "\t";
      sb += this._addTypeDef(value);
      sb += `get ${publicFieldName} => $privateFieldName;\n\tset ${publicFieldName}(`;
      sb += this._addTypeDef(value);
      sb += ` ${publicFieldName}) => ${privateFieldName} = ${publicFieldName};`;
      return sb;
    }).join("\n");
  }

  _defaultPrivateConstructor(): string {
    var sb = "";
    sb += `\t${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    Array.from(this.fields).map(([key, value]) => {
      var publicFieldName = fixFieldName(key, this._name, false);
      sb += this._addTypeDef(value);
      sb += ` ${publicFieldName}`;
      if (i !== len) {
        sb += ", ";
      }
      i++;
    });
    sb += "}) {\n";
    Array.from(this.fields).map(([key, _]) => {
      var publicFieldName = fixFieldName(key, this._name, false);
      var privateFieldName = fixFieldName(key, this._name, true);
      sb += `this.${privateFieldName} = ${publicFieldName};\n`;
    });
    sb += "}";
    return sb;
  }

  _defaultConstructor(equatable: boolean = false, immutable: boolean = false): string {
    var sb = "";
    if (equatable || immutable) {
      sb += `\t${this._constFieldKeyword(true)}${this.getClassName()}({`;
    } else {
      sb += `\t${this._constFieldKeyword(false)}${this.getClassName()}({`;
    }
    var len = Array.from(this.fields).length;
    var isShort = len < 3;
    for (var [key, _] of this.fields) {
      var fieldName = fixFieldName(key, this._name, this._privateFields);
      sb += isShort ? `this.${fieldName}` : `\n\t\tthis.${fieldName},`;
      if (isShort) { sb += ", "; }
    };
    sb += isShort ? "});" : "\n\t});";
    return isShort ? sb.replace(", });", "});") : sb;
  }

  _jsonParseFunc(): string {
    var sb = "";
    sb += `\tfactory ${this.getClassName()}`;
    sb += `.fromJson(Map<String, dynamic> json) {\n\t\treturn ${this.getClassName()}(\n`;
    sb += Array.from(this.fields).map(([key, value]) => {
      return `\t\t\t${joinAsClass(fixFieldName(key, this.getClassName(), this._privateFields), jsonParseValue(key, value))}`;
    }).join('\n');
    sb += "\n\t\t);\n\t}";
    return sb;
  }

  _jsonGenFunc(): string {
    var sb = "";
    sb += "\tMap<String, dynamic> toJson() {\n\t\treturn {\n";
    Array.from(this.fields).map(([key, value]) => {
      sb += `\t\t\t${toJsonExpression(key, this.getClassName(), value, this._privateFields)}\n`;
    });
    sb += "\t\t};\n";
    sb += "\t}";
    return sb;
  }

  /**
   * Generate function for json_serializable and freezed.
   * @param freezed force to generate expression body (required for freezed generator).
   */
  _codeGenJsonParseFunc(freezed: boolean = false): string {
    var expressionBody = `\tfactory ${this.getClassName()}.fromJson(Map<String, dynamic> json) => _$${this.getClassName()}FromJson(json);`;
    var blockBody = `\tfactory ${this.getClassName()}.fromJson(Map<String, dynamic> json) {\n\t\treturn _$${this.getClassName()}FromJson(json);\n\t}`;
    return expressionBody.length > 78 && !freezed ? blockBody : expressionBody;
  }

  _codeGenJsonGenFunc(): string {
    var expressionBody = `\tMap<String, dynamic> toJson() => _$${this.getClassName()}ToJson(this);`;
    var blockBody = `\tMap<String, dynamic> toJson() {\n\t\treturn _$${this.getClassName()}ToJson(this);\n\t}`;
    return expressionBody.length > 78 ? blockBody : expressionBody;
  }

  /**
   * Generate copyWith(); mehtod for easier work with immutable classes.
   * @param copyWith method should be generated or not.
   */
  _copyWithMethod(copyWith: boolean = false): string {
    if (!copyWith) { return ''; }
    var sb = "";
    sb += printLine(`\n\n${this.getClassName()} copyWith({`, false, 1);
    // Constructor objects.
    for (let [key, value] of this.fields) {
      var fieldName = fixFieldName(key, this.getClassName(), this._privateFields);
      sb += printLine(`${this._addTypeDef(value)} ${fieldName},`, true, 2);
    }
    sb += printLine("}) {", true, 1);
    sb += printLine(`return ${this.getClassName()}(`, true, 2);
    // Return constructor.
    for (let [key, _] of this.fields) {
      var fieldName = fixFieldName(key, this.getClassName(), this._privateFields);
      sb += printLine(`${fieldName}: ${fieldName} ?? this.${fieldName},`, true, 3);
    }
    sb += printLine(");", true, 2);
    sb += printLine("}", true, 1);
    return sb;
  }

  /**
   * Generate toString(); mehtod to improve the debugging experience..
   * @param toString method should be generated or not.
   */
  _toStringMethod(toString: boolean = false): string {
    if (!toString) { return ''; }
    var fieldName = (name: string): string => `${fixFieldName(name, this._name, this._privateFields)}: $${fixFieldName(name, this._name, this._privateFields)}`;
    var expressionBody = `\n\n\t@override\n\tString toString() => `
      + `'${this.getClassName()}(${Array.from(this.fields.keys()).map((name) => fieldName(name)).join(', ')})';`.replace(' \'', '\'');
    var blockBody = `\n\n\t@override\n\tString toString() {\n\t\treturn '`
      + `${this.getClassName()}(${Array.from(this.fields.keys()).map((name) => fieldName(name)).join(', ')})';\n\t}`;
    var isShort = expressionBody.length < 76;
    return isShort ? expressionBody : blockBody;
  }

  /**
   * Equality Operator to compare different instances of `Objects`.
   * @param equality method should be generated or not.
   */
  _equalityOperator(equality: boolean = false): string {
    if (!equality) { return ''; }
    var fieldName = (name: string): string => `identical(o.${fixFieldName(name, this._name, this._privateFields)}, ${fixFieldName(name, this._name, this._privateFields)})`;
    var expressionBody = `\n\n\t@override\n\tbool operator ==(Object o) => o is `
      + `${this.getClassName()} && `
      + `${Array.from(this.fields.keys()).map((name) => fieldName(name)).join(' &&')};`.replace(' &&;', ';');
    var blockBody = `\n\n\t@override\n\tbool operator ==(Object o) =>\n\t\t\to is `
      + `${this.getClassName()} &&\n\t\t\t`
      + `${Array.from(this.fields.keys()).map((name) => fieldName(name)).join(' &&\n\t\t\t')};`.replace(' &&;', ';');
    var isShort = expressionBody.length < 89;
    return isShort ? expressionBody : blockBody;
  }

  _hashCode(equality: boolean = false): string {
    if (!equality) { return ''; }
    var keys = Array.from(this.fields.keys());
    var len = keys.length;
    var oneValueBody = `\n\n\t@override\n\tint get hashCode => `
      + `${keys.map((name) => `${fixFieldName(name, this._name, this._privateFields)}`)}`
      + `.hashCode;`;
    var expressionBody = `\n\n\t@override\n\tint get hashCode => hashValues(`
      + `${keys.map((name) => `${fixFieldName(name, this._name, this._privateFields)}`).join(', ')});`.replace(' ,);', ');');
    var blockBody = `\n\n\t@override\n\tint get hashCode {\n\t\treturn hashValues(\n\t\t\t`
      + `${keys.map((name) => `${fixFieldName(name, this._name, this._privateFields)},`).join('\n\t\t\t')}\n\t\t);\n\t}`;
    var isShort = expressionBody.length < 87;
    var expression = len === 1 ? oneValueBody : expressionBody;
    return isShort ? expression : blockBody;
  }

  toCodeGenString(input: Input): string {
    var field = "";

    if (input.freezed) {
      field += `${this._dartImportsList(input)}`;
      field += `${this._packageImportsList(input)}`;
      field += `${this._importList()}`;
      field += `${this._partImportsList(input)}`;
      field += `${this._freezedField()}`;
      return field;
    } else {
      if (this._privateFields) {
        field += `${this._dartImportsList(input)}`;
        field += `${this._packageImportsList(input)}`;
        field += `${this._importList()}`;
        field += `${this._partImportsList(input)}`;
        field += `@JsonSerializable()\n`;
        field += `class ${this.getClassName()}${input.equatable ? ' extends Equatable' : ''}; {\n`;
        field += `${this._fieldListCodeGen(input.isImmutable())}\n\n`;
        field += `${this._defaultPrivateConstructor()}`;
        field += `${this._toStringMethod(input.toString)}\n\n`;
        field += `${this._gettersSetters()}\n\n`;
        field += `${this._codeGenJsonParseFunc()}\n\n`;
        field += `${this._codeGenJsonGenFunc()}`;
        field += `${this._copyWithMethod(input.copyWith)}`;
        field += `${this._equalityOperator(input.equality)}`;
        field += `${this._hashCode(input.equality)}`;
        field += `${this.equatablePropList(input.equatable)}\n}\n`;
        return field;
      } else {
        field += `${this._dartImportsList(input)}`;
        field += `${this._packageImportsList(input)}`;
        field += `${this._importList()}`;
        field += `${this._partImportsList(input)}`;
        field += `@JsonSerializable()\n`;
        field += `class ${this.getClassName()}${input.equatable ? ' extends Equatable' : ''} {\n`;
        field += `${this._fieldListCodeGen(input.isImmutable())}\n\n`;
        field += `${this._defaultConstructor(input.isImmutable())}`;
        field += `${this._toStringMethod(input.toString)}\n\n`;
        field += `${this._codeGenJsonParseFunc()}\n\n`;
        field += `${this._codeGenJsonGenFunc()}`;
        field += `${this._copyWithMethod(input.copyWith)}`;
        field += `${this._equalityOperator(input.equality)}`;
        field += `${this._hashCode(input.equality)}`;
        field += `${this.equatablePropList(input.equatable)}\n}\n`;
        return field;
      }
    }
  }

  toString(input: Input): string {
    var field = "";
    if (this._privateFields) {
      field += `${this._dartImportsList(input)}`;
      field += `${this._packageImportsList(input)}`;
      field += `${this._importList()}`;
      field += `${this._partImportsList(input)}`;
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.getClassName()}${input.equatable ? ' extends Equatable' : ''} {\n`;
      field += `${this._fieldList(input.isImmutable())}\n\n`;
      field += `${this._defaultPrivateConstructor()}`;
      field += `${this._toStringMethod(input.toString)}\n\n`;
      field += `${this._gettersSetters()}\n\n`;
      field += `${this._jsonParseFunc()}\n\n`;
      field += `${this._jsonGenFunc()}`;
      field += `${this._copyWithMethod(input.copyWith)}`;
      field += `${this._equalityOperator(input.equality)}`;
      field += `${this._hashCode(input.equality)}`;
      field += `${this.equatablePropList(input.equatable)}\n}\n`;
      return field;
    } else {
      field += `${this._dartImportsList(input)}`;
      field += `${this._packageImportsList(input)}`;
      field += `${this._importList()}`;
      field += `${this._partImportsList(input)}`;
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.getClassName()}${input.equatable ? ' extends Equatable' : ''} {\n`;
      field += `${this._fieldList(input.isImmutable())}\n\n`;
      field += `${this._defaultConstructor(input.isImmutable())}`;
      field += `${this._toStringMethod(input.toString)}\n\n`;
      field += `${this._jsonParseFunc()}\n\n`;
      field += `${this._jsonGenFunc()}`;
      field += `${this._copyWithMethod(input.copyWith)}`;
      field += `${this._equalityOperator(input.equality)}`;
      field += `${this._hashCode(input.equality)}`;
      field += `${this.equatablePropList(input.equatable)}\n}\n`;
      return field;
    }
  }
}
