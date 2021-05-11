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
 * @param {string} print string that will be printed.
 * @param {number} lines how many lines will be added.
 * @param {number} tabs how many tabs will be added.
 */
export const printLine = (print: string, lines = 0, tabs = 0): string => {
  var sb = '';

  for (let i = 0; i < lines; i++) {
    sb += '\n';
  }
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
 * To indicate that a variable might have the value null.
 * @param {Input} input the user input.
 * @returns string as "?" if null safety enabled. Otherwise empty string.
 */
const defaultValue = (
  typeDef: TypeDefinition,
  nullable: boolean = false,
  freezed: boolean = false,
): string => {
  if (!typeDef.defaultValue) { return ""; }
  if (typeDef.isList && typeDef.type !== null) {
    const listType = typeDef.type?.replace(/List/g, "");
    const listTypes = filterListType(typeDef.type);
    if (!freezed) {
      const withType = ` = const ${listType}[]`;
      const withoutType = ` = const []`;
      return listTypes.length > 1 ? withoutType : withType;
    } else {
      const withType = ` @Default(${listType}[])`;
      const withoutType = ` @Default([])`;
      return listTypes.length > 1 ? withoutType : withType;
    }
  } else if (typeDef.isDate) {
    if (!freezed) {
      const questionMark = nullable ? "?" : "";
      return `${typeDef.type}${questionMark} ${typeDef.name}`;
    } else {
      return '';
    }
  } else if (typeDef.type?.startsWith("String")) {
    const freezedDefaultString = ` @Default('${typeDef.value}')`;
    const defaultString = ` = '${typeDef.value}'`;
    return freezed ? freezedDefaultString : defaultString;
  }
  const freezedDefaultValue = ` @Default(${typeDef.value})`;
  const defaultValue = ` = ${typeDef.value}`;
  return freezed ? freezedDefaultValue : defaultValue;
};

const defaultDateTime = (
  fields: Map<string, TypeDefinition>,
  freezed: boolean = false,
  nullSafety: boolean = false,
): string => {
  let sb = "";
  let dates = Array.from(fields).filter(
    (v) => v[1].isDate && !v[1].isList && v[1].defaultValue
  );
  if (!dates.length) { return sb; }
  if (freezed) {
    for (let i = 0; i < dates.length; i++) {
      const typeDef = dates[i][1];
      const optional = 'optional' + pascalCase(typeDef.name);
      const expressionBody = (): string => {
        let body = '';
        body += printLine(`DateTime get ${typeDef.name} => ${optional}`, 1, 1);
        body += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true)};`);
        return body;
      };
      const blockBody = (): string => {
        let body = '';
        body += printLine(`DateTime get ${typeDef.name} {`, 1, 1);
        body += printLine(`return ${optional} ?? ${parseDateTime(`'${typeDef.value}'`, true,)};`, 1, 2);
        body += printLine('}', 1, 1);
        return body;
      };
      sb += '\n';
      if (!nullSafety) {
        sb += printLine('@late', 1, 1);
        sb += expressionBody();
      } else {
        sb += expressionBody().length > 78 ? blockBody() : expressionBody();
      }
    }
  } else {
    for (let i = 0; i < dates.length; i++) {
      const typeDef = dates[i][1];
      const comma: string = dates.length - 1 === i ? "" : ",";
      if (i === 0) {
        sb += printLine(`\t: ${typeDef.name} = ${typeDef.name}`);
        sb += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true)}`) + comma;
      } else {
        sb += printLine(`\n\t\t\t\t${typeDef.name} = ${typeDef.name}`);
        sb += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true)}`) + comma;
      }
    }
  }
  return sb;
};

const requiredValue = (required: boolean = false, nullSafety: boolean = false): string => {
  if (required) {
    return nullSafety ? "required " : "@required ";
  } else {
    return "";
  }
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
  // IMPORTANT. To keep the formatting correct.
  // By using block body. Default tabs are longTab = 5; shortTab = 3; 
  // By using expresion body. Default tabs are longTab = 6; shortTab = 4; 
  const longTab = 6;
  const shortTab = 4;
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
        const tabs = longTab + index;
        if (input.nullSafety) {
          if (i === 0) {
            formatedValue += printLine(`?.map((e) => (e as List<dynamic>)`, 1, tabs);
          } else {
            formatedValue += printLine(`.map((e) => (e as List<dynamic>)`, 1, tabs);
          }
        } else {
          formatedValue += printLine(`?.map((e) => (e as List<dynamic>)`, 1, tabs);
        }
      }
      if (input.nullSafety) {
        const tabs = shortTab + 2 * result.length;
        if (result.length > 1) {
          if (typeDef.isDate) {
            formatedValue += printLine(`.map((e) => ${parseDateTime("e")})`, 1, tabs);
          } else {
            formatedValue += printLine(`.map((e) => ${buildParseClass(key, "e")})`, 1, tabs);
          }
        } else {
          if (typeDef.isDate) {
            formatedValue += printLine(`?.map((e) => ${parseDateTime("e")})`, 1, tabs);
          } else {
            formatedValue += printLine(`?.map((e) => ${buildParseClass(key, "e")})`, 1, tabs);
          }
        }
      } else {
        formatedValue += printLine(`?.map((e) => e == null`, 1, shortTab + 2 * result.length);
        formatedValue += printLine(`? null`, 1, longTab + 2 * result.length);
        if (typeDef.isDate) {
          formatedValue += printLine(`: ${parseDateTime("e")})`, 1, longTab + 2 * result.length);
        } else {
          formatedValue += printLine(`: ${buildParseClass(key, "e")})`, 1, longTab + 2 * result.length);
        }
      }
      for (let i = 0; i < result.length - 1; i++) {
        var index = i * 2;
        const tabs = shortTab + 2 * result.length - index;
        formatedValue += printLine(input.nullSafety ? `.toList())` : `?.toList())`, 1, tabs);
      }
      formatedValue += printLine(input.nullSafety ? `.toList()` : `?.toList()`, 1, longTab);
    } else {
      // Class
      formatedValue += printLine(`${jsonValue} == null`);
      formatedValue += printLine(`? null`, 1, longTab);
      if (typeDef.isDate) {
        formatedValue += printLine(`: ${parseDateTime(jsonValue)}`, 1, longTab);
      } else {
        formatedValue += printLine(`: ${buildParseClass(key, jsonValue)}`, 1, longTab);
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

const buildParseClass = (className: string, expression: string): string => {
  const name = pascalCase(className).replace(/_/g, "");
  return `${name}.fromJson(${expression} as Map<String, dynamic>)`;
};

/**
 * DateTime parse function.
 * @param {string} expression specified value.
 * @param {boolean} clean if it is true then returns without without argument type.
 * @returns a string "DateTime.parse(expression)".
 */
const parseDateTime = (expression: string, clean: boolean = false): string => {
  const withArgumentType = `DateTime.parse(${expression} as String)`;
  const withoutArgumentType = `DateTime.parse(${expression})`;
  return clean ? withoutArgumentType : withArgumentType;
};

const toIsoString = (expression: string, nullSafety: boolean = false): string => {
  const withNullCheck = `${expression}?.toIso8601String()`;
  const withoutNullCheck = `${expression}.toIso8601String()`;
  return nullSafety ? withoutNullCheck : withNullCheck;
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
    this._name = pascalCase(name);
    this._path = snakeCase(name);
    this._privateFields = privateFields;
  }

  /** A class name. */
  get name() {
    return this._name;
  }

  /**
   * Update class name.
   * @param name a class name.
   */
  updateName(name: string) {
    this._name = pascalCase(name);
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
    const nonConstatValue = Array.from(this.fields.values()).some((f) => {
      return f.isDate && !f.isList && f.defaultValue;
    });
    const privatConstructor = input.nullSafety && nonConstatValue
      ? printLine(`${this.name}._();`, 2, 1)
      : '';
    sb += printLine("@freezed");
    sb += printLine(`${input.nullSafety ? "" : "abstract "}class ${this.name} with `, 1);
    sb += printLine(`_$${this.name} {`);
    sb += printLine(`factory ${this.name}({`, 1, 1);
    for (var [name, typeDef] of this.fields) {
      const optional = 'optional' + pascalCase(typeDef.name);
      const fieldName = typeDef.getName(this._privateFields);
      const jsonKey = `@JsonKey(name: '${name}') `;
      const defaultVal = defaultValue(typeDef, input.nullSafety, true);
      const required = requiredValue(typeDef.required, input.nullSafety);
      sb += printLine(jsonKey + required + defaultVal, 1, 2);
      if (typeDef.isDate && typeDef.defaultValue && !typeDef.isList) {
        sb += printLine(`${this.addType(typeDef, input)} ${optional},`);
      } else {
        sb += printLine(`${this.addType(typeDef, input)} ${fieldName},`);
      }
    };
    sb += printLine(`}) = _${this.name};`, 1, 1);
    sb += privatConstructor;
    sb += printLine(`${this.codeGenJsonParseFunc(true)}`);
    sb += defaultDateTime(this.fields, true, input.nullSafety);
    sb += printLine("}", 1);
    return sb;
  }

  /**
   * Returns a list of props that equatable needs to work properly.
   * @param {Input} input the user input.
   */
  private equatablePropList(input: Input): string {
    if (!input.equatable) { return ''; }
    const fields = Array.from(this.fields.values());
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine(`@override`, 2, 1);
      sb += printLine(`List<Object${questionMark(input)}> get props => [`, 1, 1);
      for (let i = 0; i < fields.length; i++) {
        const separator = fields.length - 1 === i ? '];' : ', ';
        const f = fields[i];
        sb += `${f.getName(this._privateFields)}`;
        sb += separator;
      }
      return sb;
    };

    const blockBody = (): string => {
      let sb = '';
      sb += printLine(`@override`, 2, 1);
      sb += printLine(`List<Object${questionMark(input)}> get props {`, 1, 1);
      sb += printLine('return [', 1, 2);
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        sb += printLine(`${f.getName(this._privateFields)},`, 1, 4);
      }
      sb += printLine('];', 1, 2);
      sb += printLine('}', 1, 1);
      return sb;
    };

    var isShort = expressionBody().length < 87;

    return isShort ? expressionBody() : blockBody();

  }

  /**
   * Equatable toString method including all the given props.
   * @returns string block.
   */
  private stringify(): string {
    var sb = '';
    sb += printLine('@override', 2, 1);
    sb += printLine('bool get stringify => true;', 1, 1);
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
    const required = Array.from(this.fields.values()).some((f) => f.required && !input.nullSafety);
    const listEquality = Array.from(this.fields.values()).some((f) => f.isList && input.equality);
    // Sorted alphabetically for effective dart style.
    imports += input.equatable && !input.freezed
      ? "import 'package:equatable/equatable.dart';\n"
      : "";
    imports += input.immutable && !input.serializable || required || listEquality
      ? "import 'package:flutter/foundation.dart';\n"
      : "";
    imports += input.serializable && !input.freezed
      ? `import 'package:json_annotation/json_annotation.dart';\n`
      : "";
    imports += input.freezed
      ? "import 'package:freezed_annotation/freezed_annotation.dart';\n"
      : "";

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
        sb = "import '" + f.importName + `.dart';\n`;
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
      sb += `get ${publicName} => ${privateName};\n\tset ${publicName}(`;
      sb += this.addType(f, input);
      sb += ` ${publicName}) => ${privateName} = ${publicName};`;
      return sb;
    }).join("\n");
  }

  private defaultPrivateConstructor(input: Input): string {
    var sb = "";
    sb += `\t${this.name}({`;
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

  private defaultConstructor(input: Input): string {
    let constructor = '';
    const values = Array.from(this.fields.values());
    const defaultDate = defaultDateTime(this.fields);
    const isDefaultDate = defaultDate.length > 0;
    const areConstant = (typeDef: TypeDefinition) => {
      return typeDef.isDate && !typeDef.isList && typeDef.defaultValue;
    };
    const hasConstant = values.some(areConstant);
    const expression = (lines: number, tabs: number): string => {
      let sb = "";
      sb += `\t`;
      sb += hasConstant ? '' : this.constKeyword(input.isImmutable);
      sb += `${this.name}({`;
      values.forEach((f) => {
        const name = f.getName(this._privateFields);
        const isDefaultDate = f.isDate && f.defaultValue && !f.isList;
        const thisKeyword = isDefaultDate ? '' : `this.${name}`;
        const required = requiredValue(f.required, input.nullSafety);
        const defaultVal = defaultValue(f, input.nullSafety);
        const field = required + thisKeyword + defaultVal;
        sb += printLine(`${field}, `, lines, tabs);
      });
      sb += printLine('});', lines, tabs >= 1 ? 1 : 0);
      return sb;
    };
    const isShort = expression(0, 0).length < 78;
    if (isShort && !isDefaultDate) {
      // Expression body.
      constructor = expression(0, 0).replace(", });", "});");
    } else if (isDefaultDate) {
      // Force print block body for better format.
      // Block body with initialized non-constant values.
      constructor = expression(1, 2).replace("});", "})");
      constructor += printLine(`${defaultDate};`, 0, 1);
    } else {
      // Block body.
      constructor = expression(1, 2);
    }

    return constructor;
  }

  private jsonParseFunc(input: Input): string {
    const blockBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}`, 2, 1);
      sb += printLine('.fromJson(Map<String, dynamic> json) {');
      sb += printLine(`return ${this.name}(\n`, 1, 2);
      sb += this.getFields((f, k) => {
        return `\t\t\t${joinAsClass(f.getName(this._privateFields), jsonParseValue(k, f, input))}`;
      }).join('\n');
      sb += printLine(");", 1, 2);
      sb += printLine("}", 1, 1);
      return sb;
    };
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}`, 2, 1);
      sb += printLine('.fromJson(Map<String, dynamic> json) => ');
      sb += printLine(`${this.name}(\n`);
      sb += this.getFields((f, k) => {
        return `\t\t\t\t${joinAsClass(f.getName(this._privateFields), jsonParseValue(k, f, input))}`;
      }).join('\n');
      sb += printLine(");", 1, 3);
      return sb;
    };
    return expressionBody();
  }

  private toJsonFunc(input: Input): string {
    const blocBody = (): string => {
      let sb = "";
      sb += printLine("Map<String, dynamic> toJson() {", 0, 1);
      sb += printLine("return {", 1, 2);
      this.getFields((f) => {
        sb += printLine(`${toJsonExpression(f, this._privateFields, input.nullSafety)}`, 1, 3);
      });
      sb += printLine("};", 0, 2);
      sb += printLine("}", 1, 1);
      return sb;
    };
    const expressionBody = (): string => {
      var sb = "";
      sb += printLine("Map<String, dynamic> toJson() => {", 0, 1);
      this.getFields((f) => {
        sb += printLine(`${toJsonExpression(f, this._privateFields, input.nullSafety)}`, 1, 4);
      });
      sb += printLine("};", 1, 3);
      return sb;
    };
    return expressionBody();
  }

  /**
   * Generate function for json_serializable and freezed.
   * @param freezed force to generate expression body (required for freezed generator).
   */
  private codeGenJsonParseFunc(freezed: boolean = false): string {
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}.`, 2, 1);
      sb += 'fromJson(Map<String, dynamic> json) => ';
      sb += `_$${this.name}FromJson(json);`;
      return sb;
    };
    const blockBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}.`, 2, 1);
      sb += 'fromJson(Map<String, dynamic> json) {';
      sb += printLine(`return _$${this.name}FromJson(json);`, 1, 2);
      sb += printLine('}', 1, 1);
      return sb;
    };
    return expressionBody().length > 78 && !freezed
      ? blockBody()
      : expressionBody();
  }

  private codeGenToJsonFunc(): string {
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine('Map<String, dynamic> toJson() => _$', 0, 1);
      sb += `${this.name}ToJson(this);`;
      return sb;
    };
    const blockBody = () => {
      let sb = '';
      sb += printLine('Map<String, dynamic> toJson() {', 0, 1);
      sb += printLine(`return _$${this.name}ToJson(this);`, 1, 2);
      sb += printLine('}', 1, 1);
      return sb;
    };
    return expressionBody().length > 78
      ? blockBody()
      : expressionBody();
  }

  /**
   * Generate copyWith(); mehtod for easier work with immutable classes.
   * @param copyWith method should be generated or not.
   */
  private copyWithMethod(input: Input): string {
    if (!input.copyWith) { return ''; }
    const values = Array.from(this.fields.values());
    var sb = "";
    sb += printLine(`${this.name} copyWith({`, 2, 2);
    // Constructor objects.
    for (const value of values) {
      sb += printLine(`${this.addType(value, input)} ${value.name},`, 1, 2);
    }
    sb += printLine("}) {", 1, 1);
    sb += printLine(`return ${this.name}(`, 1, 2);
    // Return constructor.
    for (const value of values) {
      sb += printLine(`${value.name}: ${value.name} ?? this.${value.name},`, 1, 3);
    }
    sb += printLine(");", 1, 2);
    sb += printLine("}", 1, 1);
    return sb;
  }

  /**
   * Generate toString(); mehtod to improve the debugging experience..
   * @param toString method should be generated or not.
   */
  private toStringMethod(toString: boolean = false): string {
    if (!toString) { return ''; }
    const values = Array.from(this.fields.values());
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('String toString() => ', 1, 1);
      sb += `'${this.name}(`;
      for (let i = 0; i < values.length; i++) {
        const isEnd = values.length - 1 === i;
        const name = values[i].name;
        const separator = isEnd ? ')\';' : ', ';
        sb += `${name}: $${name}`;
        sb += separator;
      }
      return sb;
    };

    const blockBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('String toString() {', 1, 1);
      sb += printLine(`return '${this.name}(`, 1, 2);
      for (let i = 0; i < values.length; i++) {
        const isEnd = values.length - 1 === i;
        const name = values[i].name;
        const separator = isEnd ? ')\';' : ', ';
        sb += `${name}: $${name}`;
        sb += separator;
      }
      sb += printLine('}', 1, 1);
      return sb;
    };
    var isShort = expressionBody().length < 90;
    return isShort ? expressionBody() : blockBody();
  }

  /**
   * Equality Operator to compare different instances of `Objects`.
   * @param equality method should be generated or not.
   */
  private equalityOperator(input: Input): string {
    if (!input.equality || input.equatable) { return ''; }
    const fields = Array.from(this.fields.values());
    let sb = '';
    sb += printLine('@override', 2, 1);
    sb += printLine('bool operator ==(Object other) {', 1, 1);
    sb += printLine('if (identical(other, this)) return true;', 1, 2);
    sb += printLine(`return other is ${this.name} &&\n\t\t\t`, 1, 2);
    for (let i = 0; i < fields.length; i++) {
      const isEnd = fields.length - 1 === i;
      const field = fields[i];
      const separator = isEnd ? ';' : ' &&\n\t\t\t\t';
      if (field.isList) {
        sb += `listEquals(other.${field.name}, ${field.name})`;
        sb += separator;
      } else {
        sb += `other.${field.name} == ${field.name}`;
        sb += separator;
      }
    }
    sb += printLine('}', 1, 1);
    return sb;
  }

  private hashCode(input: Input): string {
    if (!input.equality || input.equatable) { return ''; }
    const keys = Array.from(this.fields.keys());
    const fields = Array.from(this.fields.values());
    const isOneValue = keys.length === 1;
    const oneValueBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('int get hashCode => ', 1, 1);
      sb += fields[0].name;
      sb += '.hashCode;';
      return sb;
    };
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('int get hashCode => hashValues(', 1, 1);
      fields.forEach((f, i, arr) => {
        const isEnd = arr.length - 1 === i;
        const separator = isEnd ? ');' : ', ';
        sb += `${f.name}`;
        sb += separator;
      });
      return sb;
    };
    const blockBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('int get hashCode {', 1, 1);
      sb += printLine('return hashValues(', 1, 2);
      fields.forEach((f) => {
        sb += printLine(`${f.name},`, 1, 3);
      });
      sb += printLine(');', 1, 2);
      sb += printLine('}', 1, 1);
      return sb;
    };
    const isShort = expressionBody().length < 91;
    const expression = isOneValue ? oneValueBody() : expressionBody();
    return isShort ? expression : blockBody();
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
        field += `${this.defaultConstructor(input)}`;
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
      field += `${this.defaultConstructor(input)}`;
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
