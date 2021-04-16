import { fixFieldName, camelCase, pascalCase, snakeCase, filterListType } from "./helper";
import { Input } from "./input";
import { TypeDefinition } from "./constructor";
import * as _ from "lodash";

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
export const printLine = (print: string, newLine = false, tabs = 0): string => {
  var sb = '';
  sb += newLine ? '\n' : '';
  for (let i = 0; i < tabs; i++) {
    sb += '\t';
  }
  sb += print;
  return sb;
};

/**
 * To indicate that a variable might have the value null.
 * @param {Input} input the user input.
 * @returns string as "?" if null safety enabled. Otherwise empty string.
 */
const questionMark = (input: Input): string => {
  return input.nullSafety ? "?" : "";
};

/**
 * Returns a string representation of a value obtained from a JSON
 * @param valueKey The key of the value in the JSON
 */
export const valueFromJson = (valueKey: string): string => {
  return `json['${valueKey}']`;
};

/**
 * Returns a string representation of a value beign assigned to a field/prop
 * @param key The field/prop name
 * @param value The value to assign to the field/prop
 */
export const joinAsClass = (key: string, value: string): string => {
  return `${key}: ${value},`;
};

const jsonParseClass = (key: string, typeDef: TypeDefinition, input: Input): string => {
  const jsonValue = valueFromJson(key);
  const type = typeDef.type;
  let formatedValue = '';
  if (type !== null && !typeDef.isPrimitive || type !== null && typeDef.isDate) {
    if (typeDef.isList) {
      // Responsive farmatting.
      // List of List Classes (List<List.......<Class>>)
      // This will generate deeply nested infinity list depending on how many lists are in the lists.
      const result = filterListType(type);
      formatedValue = printLine(`(${jsonValue} as List<dynamic>${questionMark(input)})`);
      for (let i = 0; i < result.length - 1; i++) {
        var index = i * 2;
        const tabs = 5 + index;
        if (input.nullSafety) {
          if (i === 0) {
            formatedValue += printLine(`?.map((e) => (e as List<dynamic>)`, true, tabs);
          } else {
            formatedValue += printLine(`.map((e) => (e as List<dynamic>)`, true, tabs);
          }
        } else {
          formatedValue += printLine(`?.map((e) => (e as List<dynamic>)`, true, tabs);
        }
      }
      if (input.nullSafety) {
        const tabs = 3 + 2 * result.length;
        if (result.length > 1) {
          if (typeDef.isDate) {
            formatedValue += printLine(`.map((e) => ${parseDateTime("e")})`, true, tabs);
          } else {
            formatedValue += printLine(`.map((e) => ${buildParseClass(key, jsonValue, true)})`, true, tabs);
          }
        } else {
          if (typeDef.isDate) {
            formatedValue += printLine(`?.map((e) => ${parseDateTime("e")})`, true, tabs);
          } else {
            formatedValue += printLine(`?.map((e) => ${buildParseClass(key, jsonValue, true)})`, true, tabs);
          }
        }
      } else {
        formatedValue += printLine(`?.map((e) => e == null`, true, 3 + 2 * result.length);
        formatedValue += printLine(`? null`, true, 5 + 2 * result.length);
        if (typeDef.isDate) {
          formatedValue += printLine(`: ${parseDateTime(jsonValue)})`, true, 5 + 2 * result.length);
        } else {
          formatedValue += printLine(`: ${buildParseClass(key, jsonValue)})`, true, 5 + 2 * result.length);
        }
      }
      for (let i = 0; i < result.length - 1; i++) {
        var index = i * 2;
        const tabs = 3 + 2 * result.length - index;
        formatedValue += printLine(input.nullSafety ? `.toList())` : `?.toList())`, true, tabs);
      }
      formatedValue += printLine(input.nullSafety ? `.toList()` : `?.toList()`, true, 5);
    } else {
      // Class
      formatedValue += printLine(`${jsonValue} == null`);
      formatedValue += printLine(`? null`, true, 5);
      if (typeDef.isDate) {
        formatedValue += printLine(`: ${parseDateTime(jsonValue)}`, true, 5);
      } else {
        formatedValue += printLine(`: ${buildParseClass(key, jsonValue)}`, true, 5);
      }
    }
  }
  return formatedValue;
};

const toJsonClass = (
  typeDef: TypeDefinition,
  privateField: boolean,
  nullSafety: boolean = false
): string => {
  const fieldKey = typeDef.getName(privateField);
  const thisKey = `${fieldKey}`;
  const type = typeDef.type;
  var sb = '';
  if (type !== null && !typeDef.isPrimitive || type !== null && typeDef.isDate) {
    if (typeDef.isList) {
      const result = filterListType(type);
      if (result.length > 1) {
        // Responsive formatting.
        // This will generate infiniti maps depending on how many lists are in the lists.
        // By default this line starts with keyword List, slice will remove it.
        if (nullSafety) {
          sb += printLine(`'${typeDef.jsonKey}': ${thisKey}?`);
          sb += Array.from(result).map(_ => printLine('.map((e) => e')).slice(0, -1).join('');
          if (typeDef.isDate) {
            sb += printLine(`.map((e) => ${toIsoString("e", true)})`);
          } else {
            sb += printLine(`.map((e) => ${buildToJsonClass("e", true)})`);
          }
          sb += Array.from(result).map(_ => printLine('.toList())')).slice(0, -1).join('');
          sb += printLine('.toList(),');
        } else {
          sb += printLine(`'${typeDef.jsonKey}': ${thisKey}`);
          sb += Array.from(result).map(_ => printLine('?.map((e) => e')).slice(0, -1).join('');
          if (typeDef.isDate) {
            sb += printLine(`?.map((e) => ${toIsoString("e")})`);
          } else {
            sb += printLine(`?.map((e) => ${buildToJsonClass("e")})`);
          }
          sb += Array.from(result).map(_ => printLine('?.toList())')).slice(0, -1).join('');
          sb += printLine('?.toList(),');
        }
      } else {
        if (nullSafety) {
          if (typeDef.isDate) {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${toIsoString("e", true)}).toList(),`;
          } else {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${buildToJsonClass("e", true)}).toList(),`;
          }
        } else {
          if (typeDef.isDate) {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${toIsoString("e")})?.toList(),`;
          } else {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${buildToJsonClass("e")})?.toList(),`;
          }
        }
      }
    } else {
      // Class
      if (typeDef.isDate) {
        sb = `'${typeDef.jsonKey}': ${toIsoString(thisKey)},`;
      } else {
        sb = `'${typeDef.jsonKey}': ${buildToJsonClass(thisKey)},`;
      }
    }
  }
  return sb;
};

export function jsonParseValue(
  key: string,
  typeDef: TypeDefinition,
  input: Input
) {
  const jsonValue = valueFromJson(key);
  let formatedValue = '';
  if (typeDef.isPrimitive) {
    if (typeDef.isDate) {
      formatedValue = jsonParseClass(key, typeDef, input);
    } else {
      if (typeDef.type?.match("dynamic") && !typeDef.isList) {
        formatedValue = `${jsonValue}`;
      } else {
        formatedValue = `${jsonValue} as ${typeDef.type}` + questionMark(input);
      }
    }
  } else {
    formatedValue = jsonParseClass(key, typeDef, input);
  }
  return formatedValue;
}

export function toJsonExpression(
  typeDef: TypeDefinition,
  privateField: boolean,
  nullSafety: boolean = false
): string {
  const fieldKey = typeDef.getName(privateField);
  const thisKey = `${fieldKey}`;
  if (typeDef.isPrimitive) {
    if (typeDef.isDate) {
      return toJsonClass(typeDef, privateField, nullSafety);
    } else {
      return `'${typeDef.jsonKey}': ${thisKey},`;
    }
  } else {
    return toJsonClass(typeDef, privateField, nullSafety);
  }
}

const buildToJsonClass = (expression: string, nullSafety: boolean = false): string => {
  return nullSafety
    ? `${expression}.toJson()`
    : `${expression}?.toJson()`;
};

const buildParseClass = (className: string, expression: string, nullSafety: boolean = false): string => {
  const name = pascalCase(className).replace(/_/g, "");
  return `${name}.fromJson(${nullSafety ? "e" : expression} as Map<String, dynamic>)`;
};

const parseDateTime = (expression: string): string => {
  return `DateTime.parse(${expression} as String)`;
};

const toIsoString = (expression: string, nullSafety: boolean = false): string => {
  return nullSafety
    ? `${expression}.toIso8601String()`
    : `${expression}?.toIso8601String()`;
};

export class Dependency {
  name: string;
  typeDef: TypeDefinition;

  constructor(name: string, typeDef: TypeDefinition) {
    this.name = name;
    this.typeDef = typeDef;
  }

  get className(): string {
    return camelCase(this.name);
  }
}

export class ClassDefinition {
  private _name: string;
  private _path: string;
  private _privateFields: boolean;
  fields: Map<string, TypeDefinition> = new Map<string, TypeDefinition>();

  constructor(name: string, privateFields = false) {
    this._name = pascalCase(name).replace(/_/g, "");
    this._path = snakeCase(name);
    this._privateFields = privateFields;
  }

  /** A class name. */
  get name() {
    return this._name;
  }

  /** A class that converted back to the value 
   * @returns as object.
  */
  get value() {
    const keys = Array.from(this.fields.keys());
    const values = Array.from(this.fields.values()).map((v) => v.value);
    return _.zipObject(keys, values);
  }

  /** A path used for file names. */
  get path() {
    return this._path;
  }

  /**
   * Check if has value.
   * @param other value to compare.
   * @returns true if has value.
   */
  hasValue(other: any): boolean {
    return _.isEqual(this.value, other);
  }

  /**
   * Check if the path exists.
   * @param {string} path a path to compare.
   * @returns true if path exists.
   */
  hasPath(path: string): boolean {
    return this._path === path;
  }

  /**
   * Path must contain the same import name as in the TypeDefinition.
   * @param {string} path a new name for path.
   */
  updatePath(path: string) {
    this._path = snakeCase(path);
  }

  get privateFields() {
    return this._privateFields;
  }

  get dependencies(): Array<Dependency> {
    var dependenciesList = new Array<Dependency>();
    for (let [key, value] of this.fields) {
      if (!value.isPrimitive) {
        dependenciesList.push(new Dependency(key, value));
      }
    }
    return dependenciesList;
  }

  private getFields(callbackfn: (typeDef: TypeDefinition, key: string) => any): TypeDefinition[] {
    return Array.from(this.fields).map(([k, v]) => callbackfn(v, k));
  }

  has = (other: ClassDefinition): boolean => {
    var otherClassDef: ClassDefinition = other;
    return this.isSubsetOf(otherClassDef) && otherClassDef.isSubsetOf(this)
      ? true
      : false;
  };

  private isSubsetOf = (other: ClassDefinition): boolean => {
    const keys = Array.from(this.fields.keys());
    const len = keys.length;
    for (let i = 0; i < len; i++) {
      const key = keys[i];
      var otherTypeDef = other.fields.get(key);
      if (otherTypeDef !== undefined) {
        var typeDef = this.fields.get(key);
        if (!_.isEqual(typeDef, otherTypeDef)) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  };

  hasField(otherField: TypeDefinition) {
    return (
      Array.from(this.fields.keys()).filter(
        (k: string) => _.isEqual(this.fields.get(k), otherField)
      ) !== null
    );
  }

  addField(name: string, typeDef: TypeDefinition) {
    this.fields.set(name, typeDef);
  }

  getField(key: string): TypeDefinition | undefined {
    return this.fields.get(key);
  }

  private addType(typeDef: TypeDefinition, input: Input) {
    const isDynamic = typeDef.type?.match("dynamic") && !typeDef.isList;
    if (input.freezed && input.nullSafety && isDynamic) {
      return "Object?";
    } else {
      return isDynamic
        ? typeDef.type
        : typeDef.type + questionMark(input);
    }
  }

  private fieldList(input: Input): string {
    return this.getFields((f) => {
      const fieldName = f.getName(this._privateFields);
      var sb = "\t";
      if (input.isImmutable) {
        sb += this.finalKeyword(true);
      }
      sb += this.addType(f, input) + ` ${fieldName};`;
      return sb;
    }).join("\n");
  }

  private fieldListCodeGen(input: Input): string {
    return this.getFields((f) => {
      const fieldName = f.getName(this._privateFields);
      var sb = "\t" + `@JsonKey(name: '${f.jsonKey}')\n`;
      sb += "\t";
      if (input.isImmutable) {
        sb += this.finalKeyword(true);
      }
      sb += this.addType(f, input) + ` ${fieldName};`;
      return sb;
    }).join("\n");
  }

  /**
   * Advanced abstract class with immutable values and objects.
   * @param freezed class should be printed or not.
   */
  private freezedField(input: Input): string {
    var sb = "";
    sb += printLine("@freezed");
    sb += printLine(`${input.nullSafety ? "" : "abstract "}class ${this.name} with `, true);
    sb += printLine(`_$${this.name} {`);
    sb += printLine(`factory ${this.name}({`, true, 1);
    for (var [key, value] of this.fields) {
      const fieldName = value.getName(this._privateFields);
      sb += printLine(`@JsonKey(name: "${key}")`, true, 2);
      sb += printLine(` ${this.addType(value, input)} ${fieldName},`);
    };
    sb += printLine(`}) = _${this.name};`, true, 1);
    sb += printLine(`${this.codeGenJsonParseFunc(true)}`);
    sb += printLine("}", true);
    return sb;
  }

  /**
   * Returns a list of props that equatable needs to work properly.
   * @param {Input} input the user input.
   */
  private equatablePropList(input: Input): string {
    var expressionBody = `\n\n\t@override\n\tList<Object${questionMark(input)}> get props => [`
      + `${this.getFields((f) => `${f.getName(this._privateFields)}`).join(', ')}];`.replace(' ]', ']');
    var blockBody = `\n\n\t@override\n\tList<Object${questionMark(input)}> get props {\n\t\treturn [\n\t\t\t`
      + `${this.getFields((f) => `${f.getName(this._privateFields)}`).join(',\n\t\t\t')},\n\t\t];\n\t}`;
    var isShort = expressionBody.length < 87;

    if (!input.equatable) {
      return '';
    } else {
      return isShort ? expressionBody : blockBody;
    }
  }

  /**
   * Equatable toString method including all the given props.
   * @returns string block.
   */
  private stringify(): string {
    var sb = '\n';
    sb += printLine('@override', true, 1);
    sb += printLine('bool get stringify => true;', true, 1);
    return sb;
  }

  /**
   * Keyword "final" to mark that object are immutable.
   * @param immutable should print the keyword or not
   */
  private finalKeyword(immutable: boolean = false): string {
    return immutable ? 'final ' : '';
  }

  /**
   * Keyword "const" to mark that class or object are immutable.
   * @param immutable should print the keyword or not.
   */
  private constKeyword(immutable: boolean = false): string {
    return immutable ? 'const ' : '';
  }

  /**
   * All imports from the Dart library.
   * @param input should print the keyword or not.
   */
  private importsFromDart(input: Input): string {
    if (!input.equality || input.equatable || input.freezed) {
      return "";
    }
    var imports = "";
    var len = Array.from(this.fields).length;
    // If less two hashcode values do not need import dart:ui.
    if (len > 1) {
      imports += "import 'dart:ui';\n";
    }

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  };

  /**
   * All imports from the packages library.
   * @param {Input} input the input from the user.
   */
  private importsFromPackage(input: Input): string {
    var imports = "";
    // Sorted alphabetically for effective dart style.
    imports += input.equatable && !input.freezed ? "import 'package:equatable/equatable.dart';\n" : "";
    imports += input.immutable && !input.serializable ? "import 'package:flutter/foundation.dart';\n" : "";
    imports += input.serializable && !input.freezed ? `import 'package:json_annotation/json_annotation.dart';\n` : "";
    imports += input.freezed ? "import 'package:freezed_annotation/freezed_annotation.dart';\n" : "";

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  };

  private importsForParts(input: Input): string {
    var imports = "";
    imports += input.freezed ? "part '" + this._path + ".freezed.dart';\n" : "";
    imports += input.generate ? "part '" + this._path + ".g.dart';\n" : "";
    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  }

  private importList(): string {
    var imports = "";
    imports += this.getFields((f) => {
      var sb = "";
      if (f.importName !== null) {
        sb = 'import "' + f.importName + `.dart";\n`;
      }
      return sb;
    }).sort().join("");

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += "\n";
    }
  }

  private gettersSetters(input: Input): string {
    return this.getFields((f) => {
      var publicName = f.getName(false);
      var privateName = f.getName(true);
      var sb = "";
      sb += "\t";
      sb += this.addType(f, input);
      sb += `get ${publicName} => $privateFieldName;\n\tset ${publicName}(`;
      sb += this.addType(f, input);
      sb += ` ${publicName}) => ${privateName} = ${publicName};`;
      return sb;
    }).join("\n");
  }

  private defaultPrivateConstructor(input: Input): string {
    var sb = "";
    sb += `\t${this._name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    this.getFields((f) => {
      var publicName = f.getName(false);
      sb += this.addType(f, input);
      sb += ` ${publicName}`;
      if (i !== len) {
        sb += ", ";
      }
      i++;
    });
    sb += "}) {\n";
    this.getFields((f) => {
      var publicName = f.getName(false);
      var privateName = f.getName(true);
      sb += `this.${privateName} = ${publicName};\n`;
    });
    sb += "}";
    return sb;
  }

  private defaultConstructor(equatable: boolean = false, immutable: boolean = false): string {
    var sb = "";
    if (equatable || immutable) {
      sb += `\t${this.constKeyword(true)}${this.name}({`;
    } else {
      sb += `\t${this.constKeyword(false)}${this.name}({`;
    }
    var len = Array.from(this.fields).length;
    var isShort = len < 3;
    this.getFields((f) => {
      var fieldName = f.getName(this._privateFields);
      sb += isShort ? `this.${fieldName}` : `\n\t\tthis.${fieldName},`;
      if (isShort) { sb += ", "; }
    });
    sb += isShort ? "});" : "\n\t});";
    return isShort ? sb.replace(", });", "});") : sb;
  }

  private jsonParseFunc(input: Input): string {
    var sb = "\n\n";
    sb += `\tfactory ${this.name}`;
    sb += `.fromJson(Map<String, dynamic> json) {\n\t\treturn ${this.name}(\n`;
    sb += this.getFields((f, k) => {
      return `\t\t\t${joinAsClass(f.getName(this._privateFields), jsonParseValue(k, f, input))}`;
    }).join('\n');
    sb += "\n\t\t);\n\t}";
    return sb;
  }

  private toJsonFunc(input: Input): string {
    var sb = "";
    sb += "\tMap<String, dynamic> toJson() {\n\t\treturn {\n";
    this.getFields((f) => {
      sb += `\t\t\t${toJsonExpression(f, this._privateFields, input.nullSafety)}\n`;
    });
    sb += "\t\t};\n";
    sb += "\t}";
    return sb;
  }

  /**
   * Generate function for json_serializable and freezed.
   * @param freezed force to generate expression body (required for freezed generator).
   */
  private codeGenJsonParseFunc(freezed: boolean = false): string {
    var expressionBody = `\n\n\tfactory ${this.name}.fromJson(Map<String, dynamic> json) => _$${this.name}FromJson(json);`;
    var blockBody = `\n\n\tfactory ${this.name}.fromJson(Map<String, dynamic> json) {\n\t\treturn _$${this.name}FromJson(json);\n\t}`;
    return expressionBody.length > 78 && !freezed ? blockBody : expressionBody;
  }

  private codeGenToJsonFunc(): string {
    var expressionBody = `\tMap<String, dynamic> toJson() => _$${this.name}ToJson(this);`;
    var blockBody = `\tMap<String, dynamic> toJson() {\n\t\treturn _$${this.name}ToJson(this);\n\t}`;
    return expressionBody.length > 78 ? blockBody : expressionBody;
  }

  /**
   * Generate copyWith(); mehtod for easier work with immutable classes.
   * @param copyWith method should be generated or not.
   */
  private copyWithMethod(input: Input): string {
    if (!input.copyWith) { return ''; }
    var sb = "";
    sb += printLine(`\n\n\t${this.name} copyWith({`, false, 1);
    // Constructor objects.
    for (let [_, value] of this.fields) {
      var fieldName = value.getName(this._privateFields);
      sb += printLine(`${this.addType(value, input)} ${fieldName},`, true, 2);
    }
    sb += printLine("}) {", true, 1);
    sb += printLine(`return ${this.name}(`, true, 2);
    // Return constructor.
    for (let [_, value] of this.fields) {
      var fieldName = value.getName(this._privateFields);
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
  private toStringMethod(toString: boolean = false): string {
    if (!toString) { return ''; }
    var fieldName = (name: string): string => `${name}: $${name}`;
    var expressionBody = `\n\n\t@override\n\tString toString() => `
      + `'${this.name}(${this.getFields((f) => fieldName(f.getName(this._privateFields))).join(', ')})';`.replace(' \'', '\'');
    var blockBody = `\n\n\t@override\n\tString toString() {\n\t\treturn '`
      + `${this.name}(${this.getFields((f) => fieldName(f.getName(this._privateFields))).join(', ')})';\n\t}`;
    var isShort = expressionBody.length < 76;
    return isShort ? expressionBody : blockBody;
  }

  /**
   * Equality Operator to compare different instances of `Objects`.
   * @param equality method should be generated or not.
   */
  private equalityOperator(input: Input): string {
    if (!input.equality || input.equatable) { return ''; }
    var fieldName = (name: string): string => `identical(o.${name}, ${name})`;
    var expressionBody = `\n\n\t@override\n\tbool operator ==(Object o) => o is `
      + `${this.name} && `
      + `${this.getFields((f) => fieldName(f.getName(this._privateFields))).join(' &&')};`.replace(' &&;', ';');
    var blockBody = `\n\n\t@override\n\tbool operator ==(Object o) =>\n\t\t\to is `
      + `${this.name} &&\n\t\t\t`
      + `${this.getFields((f) => fieldName(f.getName(this._privateFields))).join(' &&\n\t\t\t')};`.replace(' &&;', ';');
    var isShort = expressionBody.length < 89;
    return isShort ? expressionBody : blockBody;
  }

  private hashCode(input: Input): string {
    if (!input.equality || input.equatable) { return ''; }
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
      field += `${this.importsFromDart(input)}`;
      field += `${this.importsFromPackage(input)}`;
      field += `${this.importList()}`;
      field += `${this.importsForParts(input)}`;
      field += `${this.freezedField(input)}`;
      return field;
    } else {
      if (this._privateFields) {
        field += `${this.importsFromDart(input)}`;
        field += `${this.importsFromPackage(input)}`;
        field += `${this.importList()}`;
        field += `${this.importsForParts(input)}`;
        field += `@JsonSerializable()\n`;
        field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''}; {\n`;
        field += `${this.fieldListCodeGen(input)}\n\n`;
        field += `${this.defaultPrivateConstructor(input)}`;
        if (!input.equatable) {
          field += `${this.toStringMethod(input.toString)}`;
        }
        field += `${this.gettersSetters(input)}\n\n`;
        field += `${this.codeGenJsonParseFunc()}\n\n`;
        field += `${this.codeGenToJsonFunc()}`;
        field += `${this.copyWithMethod(input)}`;
        field += `${this.equalityOperator(input)}`;
        field += `${this.hashCode(input)}`;
        if (input.equatable && input.toString) {
          field += `${this.stringify()}`;
        }
        field += `${this.equatablePropList(input)}\n}\n`;
        return field;
      } else {
        field += `${this.importsFromDart(input)}`;
        field += `${this.importsFromPackage(input)}`;
        field += `${this.importList()}`;
        field += `${this.importsForParts(input)}`;
        field += `@JsonSerializable()\n`;
        field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
        field += `${this.fieldListCodeGen(input)}\n\n`;
        field += `${this.defaultConstructor(input.isImmutable)}`;
        if (!input.equatable) {
          field += `${this.toStringMethod(input.toString)}`;
        }
        field += `${this.codeGenJsonParseFunc()}\n\n`;
        field += `${this.codeGenToJsonFunc()}`;
        field += `${this.copyWithMethod(input)}`;
        field += `${this.equalityOperator(input)}`;
        field += `${this.hashCode(input)}`;
        if (input.equatable && input.toString) {
          field += `${this.stringify()}`;
        }
        field += `${this.equatablePropList(input)}\n}\n`;
        return field;
      }
    }
  }

  toString(input: Input): string {
    var field = "";
    if (this._privateFields) {
      field += `${this.importsFromDart(input)}`;
      field += `${this.importsFromPackage(input)}`;
      field += `${this.importList()}`;
      field += `${this.importsForParts(input)}`;
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
      field += `${this.fieldList(input)}\n\n`;
      field += `${this.defaultPrivateConstructor(input)}`;
      if (!input.equatable) {
        field += `${this.toStringMethod(input.toString)}`;
      }
      field += `${this.gettersSetters(input)}\n\n`;
      field += `${this.jsonParseFunc(input)}\n\n`;
      field += `${this.toJsonFunc(input)}`;
      field += `${this.copyWithMethod(input)}`;
      field += `${this.equalityOperator(input)}`;
      field += `${this.hashCode(input)}`;
      if (input.equatable && input.toString) {
        field += `${this.stringify()}`;
      }
      field += `${this.equatablePropList(input)}\n}\n`;
      return field;
    } else {
      field += `${this.importsFromDart(input)}`;
      field += `${this.importsFromPackage(input)}`;
      field += `${this.importList()}`;
      field += `${this.importsForParts(input)}`;
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
      field += `${this.fieldList(input)}\n\n`;
      field += `${this.defaultConstructor(input.isImmutable)}`;
      if (!input.equatable) {
        field += `${this.toStringMethod(input.toString)}`;
      }
      field += `${this.jsonParseFunc(input)}\n\n`;
      field += `${this.toJsonFunc(input)}`;
      field += `${this.copyWithMethod(input)}`;
      field += `${this.equalityOperator(input)}`;
      field += `${this.hashCode(input)}`;
      if (input.equatable && input.toString) {
        field += `${this.stringify()}`;
      }
      field += `${this.equatablePropList(input)}\n}\n`;
      return field;
    }
  }
}
