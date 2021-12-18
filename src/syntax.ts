import * as _ from 'lodash';

import { camelCase, equalByType, extractor, filterListType, pascalCase, snakeCase } from './utils';
import { ClassNameModel } from './settings';
import { Input } from './input';
import { TypeDefinition } from './constructor';
import { emptyClass } from './syntax/empty-class.syntax';

export const emptyListWarn = 'list is empty';
export const ambiguousListWarn = 'list is ambiguous';
export const ambiguousTypeWarn = 'type is ambiguous';

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
  warnings: Warning[];

  constructor(result: T, warnings: Warning[]) {
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

const includeIfNull = (jsonValue: string, input: Input): string => {
  const include = input.includeIfNull === true && input.nullSafety === false;
  return include ? `${jsonValue} == null ? null : ` : '';
};

const jsonMapType = (input: Input): string => {
  const type = input.nullSafety && input.avoidDynamicTypes ? 'Object?' : 'dynamic';
  return `Map<String, ${type}>`;
};

/**
 *  Suffix for methods to/from.
 * @param input the user input.
 * @returns string
 */
const suffix = (input: Input) => {
  const _suffix = input.fromAndToSuffix;
  const suffix = input.jsonCodecs && _suffix.toLowerCase() === 'json' ? 'Map' : _suffix;
  return input.codeGenerator === 'JSON' ? 'Json' : suffix;
};

/**
 * Adds JSON annotation only if needed for Freezed and JSON serializable.
 * @param {string} jsonKey a raw JSON key.
 */
const jsonKeyAnnotation = (name: string, jsonKey: string): string => {
  return name !== jsonKey ? `@JsonKey(name: '${jsonKey}') ` : '';
};

/**
 * To indicate that a variable might have the value null.
 * @param {Input} input the user input.
 * @returns string as "?" if null safety enabled. Otherwise empty string.
 */
const questionMark = (input: Input, typeDef?: TypeDefinition): string => {
  if (typeDef) {
    return input.nullSafety && typeDef.nullable ? '?' : '';
  } else {
    return input.nullSafety ? '?' : '';
  }
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
  if (!typeDef.defaultValue) { return ''; }
  if (typeDef.isList && typeDef.type !== null) {
    const listType = typeDef.type?.replace(/List/g, '');
    const listTypes = filterListType(typeDef.type);
    if (!freezed) {
      const withType = ` = const ${listType}[]`;
      const withoutType = ' = const []';
      return listTypes.length > 1 ? withoutType : withType;
    } else {
      const withType = ` @Default(${listType}[])`;
      const withoutType = ' @Default([])';
      return listTypes.length > 1 ? withoutType : withType;
    }
  } else if (typeDef.isDate) {
    if (!freezed) {
      const questionMark = nullable ? '?' : '';
      return `${typeDef.type}${questionMark} ${typeDef.name}`;
    } else {
      return '';
    }
  } else if (typeDef.type?.startsWith('String')) {
    const freezedDefaultString = ` @Default('${typeDef.value}')`;
    const defaultString = ` = '${typeDef.value}'`;
    return freezed ? freezedDefaultString : defaultString;
  }
  const freezedDefaultValue = ` @Default(${typeDef.value})`;
  const defaultValue = ` = ${typeDef.value}`;
  return freezed ? freezedDefaultValue : defaultValue;
};

const defaultDateTime = (
  fields: Dependency[],
  input: Input,
): string => {
  let sb = '';
  const dates = fields.filter(
    (v) => v.typeDef.isDate && !v.typeDef.isList && v.typeDef.defaultValue
  );
  if (!dates.length) { return sb; }
  if (input.freezed) {
    for (let i = 0; i < dates.length; i++) {
      const typeDef = dates[i].typeDef;
      const optional = 'optional' + pascalCase(typeDef.name);
      const expressionBody = (): string => {
        let body = '';
        body += printLine(`DateTime get ${typeDef.name} => ${optional}`, 1, 1);
        body += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true, typeDef, input)};`);
        return body;
      };
      const blockBody = (): string => {
        let body = '';
        body += printLine(`DateTime get ${typeDef.name} {`, 1, 1);
        body += printLine(`return ${optional} ?? ${parseDateTime(`'${typeDef.value}'`, true, typeDef, input)};`, 1, 2);
        body += printLine('}', 1, 1);
        return body;
      };
      sb += '\n';
      if (!input.nullSafety) {
        sb += printLine('@late', 1, 1);
        sb += expressionBody();
      } else {
        sb += expressionBody().length > 78 ? blockBody() : expressionBody();
      }
    }
  } else {
    for (let i = 0; i < dates.length; i++) {
      const typeDef = dates[i].typeDef;
      const comma: string = dates.length - 1 === i ? '' : ',';
      if (i === 0) {
        sb += printLine(`\t: ${typeDef.name} = ${typeDef.name}`);
        sb += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true, typeDef, input)}`) + comma;
      } else {
        sb += printLine(`\n\t\t\t\t${typeDef.name} = ${typeDef.name}`);
        sb += printLine(` ?? ${parseDateTime(`'${typeDef.value}'`, true, typeDef, input)}`) + comma;
      }
    }
  }
  return sb;
};

const requiredValue = (required: boolean = false, nullSafety: boolean = false): string => {
  if (required) {
    return nullSafety ? 'required ' : '@required ';
  } else {
    return '';
  }
};

/**
 * Returns a string representation of a value obtained from a JSON
 * @param valueKey The key of the value in the JSON
 */
export const valueFromJson = (valueKey: string, input: Input): string => {
  const mapValue = input.jsonCodecs ? 'data' : 'json';
  return `${mapValue}['${valueKey}']`;
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
  const jsonValue = valueFromJson(typeDef.jsonKey, input);
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
      formatedValue = printLine(`(${jsonValue} as List<dynamic>${questionMark(input, typeDef)})`);
      for (let i = 0; i < result.length - 1; i++) {
        var index = i * 2;
        const tabs = longTab + index;
        if (input.nullSafety) {
          if (i === 0) {
            formatedValue += printLine('?.map((e) => (e as List<dynamic>)', 1, tabs);
          } else {
            formatedValue += printLine('.map((e) => (e as List<dynamic>)', 1, tabs);
          }
        } else {
          formatedValue += printLine('?.map((e) => (e as List<dynamic>)', 1, tabs);
        }
      }
      if (input.nullSafety) {
        const tabs = shortTab + 2 * result.length;
        if (result.length > 1) {
          if (typeDef.isDate) {
            formatedValue += printLine(`.map((e) => ${parseDateTime('e', false, typeDef, input)})`, 1, tabs);
          } else {
            formatedValue += printLine(`.map((e) => ${buildParseClass(key, 'e', typeDef, input)})`, 1, tabs);
          }
        } else {
          if (typeDef.isDate) {
            formatedValue += printLine(`?.map((e) => ${parseDateTime('e', false, typeDef, input)})`, 1, tabs);
          } else {
            formatedValue += printLine(`?.map((e) => ${buildParseClass(key, 'e', typeDef, input)})`, 1, tabs);
          }
        }
      } else {
        formatedValue += printLine('?.map((e) => e == null', 1, shortTab + 2 * result.length);
        formatedValue += printLine('? null', 1, longTab + 2 * result.length);
        if (typeDef.isDate) {
          formatedValue += printLine(`: ${parseDateTime('e', false, typeDef, input)})`, 1, longTab + 2 * result.length);
        } else {
          formatedValue += printLine(`: ${buildParseClass(key, 'e', typeDef, input)})`, 1, longTab + 2 * result.length);
        }
      }
      for (let i = 0; i < result.length - 1; i++) {
        var index = i * 2;
        const tabs = shortTab + 2 * result.length - index;
        formatedValue += printLine(input.nullSafety ? '.toList())' : '?.toList())', 1, tabs);
      }
      formatedValue += printLine(input.nullSafety ? '.toList()' : '?.toList()', 1, longTab);
    } else {
      // Class
      formatedValue += printLine(`${jsonValue} == null`);
      formatedValue += printLine('? null', 1, longTab);
      if (typeDef.isDate) {
        formatedValue += printLine(`: ${parseDateTime(jsonValue, false, typeDef, input)}`, 1, longTab);
      } else {
        formatedValue += printLine(`: ${buildParseClass(key, jsonValue, typeDef, input)}`, 1, longTab);
      }
    }
  }
  return formatedValue;
};

const toJsonClass = (
  typeDef: TypeDefinition,
  privateField: boolean,
  input: Input
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
        if (input.nullSafety) {
          const isNullable = typeDef.nullable;
          sb += printLine(`'${typeDef.jsonKey}': ${thisKey}?`);
          sb += Array.from(result).map(_ => printLine('.map((e) => e')).slice(0, -1).join('');
          if (typeDef.isDate) {
            sb += printLine(`.map((e) => ${toIsoString('e', isNullable)})`);
          } else {
            sb += printLine(`.map((e) => ${buildToJsonClass('e', isNullable, input)})`);
          }
          sb += Array.from(result).map(_ => printLine('.toList())')).slice(0, -1).join('');
          sb += printLine('.toList(),');
        } else {
          sb += printLine(`'${typeDef.jsonKey}': ${thisKey}`);
          sb += Array.from(result).map(_ => printLine('?.map((e) => e')).slice(0, -1).join('');
          if (typeDef.isDate) {
            sb += printLine(`?.map((e) => ${toIsoString('e')})`);
          } else {
            sb += printLine(`?.map((e) => ${buildToJsonClass('e', false, input)})`);
          }
          sb += Array.from(result).map(_ => printLine('?.toList())')).slice(0, -1).join('');
          sb += printLine('?.toList(),');
        }
      } else {
        if (input.nullSafety) {
          const isNullable = typeDef.nullable;
          if (typeDef.isDate) {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${toIsoString('e', isNullable)}).toList(),`;
          } else {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${buildToJsonClass('e', isNullable, input)}).toList(),`;
          }
        } else {
          if (typeDef.isDate) {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${toIsoString('e')})?.toList(),`;
          } else {
            sb = `'${typeDef.jsonKey}': ${thisKey}?.map((e) => ${buildToJsonClass('e', false, input)})?.toList(),`;
          }
        }
      }
    } else {
      // Class
      const isNullable = input.nullSafety && !typeDef.nullable;
      if (typeDef.isDate) {
        sb = `'${typeDef.jsonKey}': ${toIsoString(thisKey, isNullable)},`;
      } else {
        sb = `'${typeDef.jsonKey}': ${buildToJsonClass(thisKey, isNullable, input)},`;
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
  const jsonValue = valueFromJson(key, input);
  const nullable = questionMark(input, typeDef);
  const isDouble = typeDef.type === 'double';
  const dafaultVal = typeDef.defaultValue
    ? `${isDouble ? '' : '?'} ?? ${defaultValue(typeDef, input.nullSafety, false).replace(/=|const/gi, '').trim()}`
    : '';
  const IfNull = `${includeIfNull(jsonValue, input)}`;
  let formatedValue = '';

  if (typeDef.isPrimitive) {
    const required = typeDef.required && input.avoidDynamicTypes ? '!' : '';

    if (typeDef.isDate) {
      formatedValue = jsonParseClass(key, typeDef, input);
    } else {
      if (!typeDef.nullable && !typeDef.isList) {
        formatedValue = `${jsonValue}`;
      } if (isDouble) {
        const nullableDouble = input.nullSafety && !typeDef.required ? '?' : '';
        formatedValue = `${IfNull}(${jsonValue}${required} as num${nullableDouble})${nullableDouble}.toDouble()` + dafaultVal;
      } else {
        formatedValue = `${IfNull}${jsonValue}${required} as ${typeDef.type}` + nullable + dafaultVal;
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
  input: Input,
): string {
  const fieldKey = typeDef.getName(privateField);
  const thisKey = `${fieldKey}`;
  if (typeDef.isPrimitive) {
    if (typeDef.isDate) {
      return toJsonClass(typeDef, privateField, input);
    } else {
      return `'${typeDef.jsonKey}': ${thisKey},`;
    }
  } else {
    return toJsonClass(typeDef, privateField, input);
  }
}

const buildToJsonClass = (expression: string, nullSafety: boolean = false, input: Input): string => {
  return nullSafety ?
    `${expression}.to${suffix(input)}()` :
    `${expression}?.to${suffix(input)}()`;
};

const buildParseClass = (className: string, expression: string, typeDef: TypeDefinition, input: Input): string => {
  const _suffix = input.fromAndToSuffix;
  const suffix = input.jsonCodecs && _suffix.toLowerCase() === 'json' ? 'Map' : _suffix;
  const name = pascalCase(className).replace(/_/g, '');
  const bangOperator = jsonMapType(input).match('Object?') && !typeDef.isList ? '!' : '';
  return `${name}.from${suffix}(${expression}${bangOperator} as ${jsonMapType(input)})`;
};

/**
 * DateTime parse function.
 * @param {string} expression specified value.
 * @param {boolean} clean if it is true then returns without without argument type.
 * @returns a string "DateTime.parse(expression)".
 */
const parseDateTime = (expression: string, withoutTypeCast: boolean = false, typeDef: TypeDefinition, input: Input): string => {
  const bangOperator = input.nullSafety && input.avoidDynamicTypes && !typeDef.isList ? '!' : '';
  const withArgumentType = `DateTime.parse(${expression}${bangOperator} as String)`;
  const withoutArgumentType = `DateTime.parse(${expression})`;
  return withoutTypeCast ? withoutArgumentType : withArgumentType;
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
  private nameEnhancement: string = '';
  fields: Dependency[] = [];

  constructor(model: ClassNameModel, privateFields = false) {
    this._name = pascalCase(model.className);
    this._path = snakeCase(model.className);
    this.nameEnhancement = model.enhancement;
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
    const keys = this.fields.map((k) => k.name);
    const values = this.fields.map((v) => v.typeDef.value);
    return _.zipObject(keys, values);
  }

  /** A path used for file names. */
  get path() {
    return this._path;
  }

  /**
   * Check if has value.
   * From the nested array will compare array object.
   * @param other value to compare.
   * @returns true if has value.
   */
  hasValue(other: any): boolean {
    if (Array.isArray(other)) {
      return _.isEqual(this.value, extractor(other));
    } else {
      return _.isEqual(this.value, other);
    }
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
   * Check if a field has identical keys and equal by type.
   * From the nested array will compare array object.
   * * For checking the exact value, use `hasValue` instead.
   * @param other value to compare.
   * @returns boolean.
   */
  hasEqualField(other: any): boolean {
    if (Array.isArray(other)) {
      return equalByType(this.value, extractor(other));
    } else {
      return equalByType(this.value, other);
    }
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

  get dependencies(): Dependency[] {
    var dependenciesList = new Array<Dependency>();
    for (const value of this.fields) {
      if (!value.typeDef.isPrimitive) {
        dependenciesList.push(new Dependency(value.name, value.typeDef));
      }
    }
    return dependenciesList;
  }

  private getFields(callbackfn: (typeDef: TypeDefinition, key: string) => any): TypeDefinition[] {
    return this.fields.map((v) => callbackfn(v.typeDef, v.name));
  }

  has = (other: ClassDefinition): boolean => {
    var otherClassDef: ClassDefinition = other;
    return this.isSubsetOf(otherClassDef) && otherClassDef.isSubsetOf(this)
      ? true
      : false;
  };

  private isSubsetOf = (other: ClassDefinition): boolean => {
    const keys = this.fields;
    const len = keys.length;
    for (let i = 0; i < len; i++) {
      var otherTypeDef = other.fields[i].typeDef;
      if (otherTypeDef !== undefined) {
        const typeDef = keys[i];
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
      this.fields.filter(
        (k) => _.isEqual(k.typeDef, otherField)
      ) !== null
    );
  }

  addField(name: string, typeDef: TypeDefinition) {
    this.fields.push(new Dependency(name, typeDef));
  }

  private addType(typeDef: TypeDefinition, input: Input) {
    const isDynamic = typeDef.type?.match('dynamic') && !typeDef.isList;

    return isDynamic
      ? typeDef.type
      : typeDef.type + questionMark(input, typeDef);

  }

  private fieldList(input: Input): string {
    return this.getFields((f) => {
      const fieldName = f.getName(this._privateFields);
      var sb = '\t';
      if (input.isImmutable) {
        sb += this.finalKeyword(true);
      }
      sb += this.addType(f, input) + ` ${fieldName};`;
      return sb;
    }).join('\n');
  }

  private fieldListCodeGen(input: Input): string {
    const final = input.isImmutable ? this.finalKeyword(true) : '';
    let sb = '';

    for (const f of this.fields.map((v) => v.typeDef)) {
      const fieldName = f.getName(this._privateFields);
      const jsonKey = jsonKeyAnnotation(f.name, f.jsonKey);

      if (jsonKey.length) {
        sb += '\t' + jsonKey + '\n';
      }

      sb += '\t' + final + this.addType(f, input) + ` ${fieldName};` + '\n';
    }

    return sb;
  }

  /**
   * Advanced abstract class with immutable values and objects.
   * @param {Input} input user input.
   */
  private freezedField(input: Input): string {
    var sb = '';
    const nonConstatValue = this.fields.some((f) => {
      return f.typeDef.isDate && !f.typeDef.isList && f.typeDef.defaultValue;
    });
    const privatConstructor = input.nullSafety && nonConstatValue
      ? printLine(`${this.name}._();`, 2, 1)
      : '';
    sb += printLine('@freezed');
    sb += printLine(`${input.nullSafety ? '' : 'abstract '}class ${this.name} with `, 1);
    sb += printLine(`_$${this.name} {`);
    sb += printLine(`factory ${this.name}({`, 1, 1);
    for (const typeDef of this.fields.map((v) => v.typeDef)) {
      const optional = 'optional' + pascalCase(typeDef.name);
      const fieldName = typeDef.getName(this._privateFields);
      const jsonKey = jsonKeyAnnotation(typeDef.name, typeDef.jsonKey);
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
    sb += printLine(`${this.codeGenJsonParseFunc(input)}`);
    sb += defaultDateTime(this.fields, input);
    sb += printLine('}', 1);
    return sb;
  }

  /**
   * Returns a list of props that equatable needs to work properly.
   * @param {Input} input user input.
   */
  private equatablePropList(input: Input): string {
    if (!input.equatable) { return ''; }
    const fields = Array.from(this.fields.values());
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine(`List<Object${questionMark(input)}> get props => [`, 1, 1);
      for (let i = 0; i < fields.length; i++) {
        const separator = fields.length - 1 === i ? '];' : ', ';
        const f = fields[i];
        sb += `${f.typeDef.getName(this._privateFields)}`;
        sb += separator;
      }
      return sb;
    };

    const blockBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine(`List<Object${questionMark(input)}> get props {`, 1, 1);
      sb += printLine('return [', 1, 2);
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        sb += printLine(`${f.typeDef.getName(this._privateFields)},`, 1, 4);
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
   * @param {boolean} print the string to be printed or no.
   * @returns string block.
   */
  private stringify(print: boolean = false): string {
    if (!print) { return ''; }
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

  private dartImports(input: Input): string {
    return input.jsonCodecs ? "import 'dart:convert';\n\n" : '';
  };

  /**
   * All imports from the packages library.
   * @param {Input} input the input from the user.
   */
  private importsFromPackage(input: Input): string {
    var imports = '';
    const required = this.fields.some((f) => f.typeDef.required && !input.nullSafety);
    const listEquality = this.fields.some((f) => f.typeDef.isList && input.equality === 'Dart');
    // Sorted alphabetically for effective dart style.
    imports += input.equatable && !input.freezed
      ? "import 'package:equatable/equatable.dart';\n"
      : '';
    imports += input.immutable && !input.serializable || input.equality === 'Dart' // || required || listEquality
      ? "import 'package:collection/collection.dart';\n"
      : '';
    imports += input.serializable && !input.freezed
      ? 'import \'package:json_annotation/json_annotation.dart\';\n'
      : '';
    imports += input.freezed
      ? "import 'package:freezed_annotation/freezed_annotation.dart';\n"
      : '';

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += '\n';
    }
  };

  private importsForParts(input: Input): string {
    var imports = '';
    imports += input.freezed ? `part '${this._path}${this.nameEnhancement}.freezed.dart';\n` : '';
    imports += input.generate ? `part '${this._path}${this.nameEnhancement}.g.dart';\n` : '';
    if (imports.length === 0) {
      return imports;
    } else {
      return imports += '\n';
    }
  }

  private importList(): string {
    let imports = '';
    const nameSet = new Set(this.fields.map((f) => f.typeDef.importName).sort());
    const names = [...nameSet];

    for (const name of names) {
      if (name !== null) {
        imports += `import '${name}${this.nameEnhancement}.dart';\n`;
      }
    }

    if (imports.length === 0) {
      return imports;
    } else {
      return imports += '\n';
    }
  }

  private gettersSetters(input: Input): string {
    return this.getFields((f) => {
      var publicName = f.getName(false);
      var privateName = f.getName(true);
      var sb = '';
      sb += '\t';
      sb += this.addType(f, input);
      sb += `get ${publicName} => ${privateName};\n\tset ${publicName}(`;
      sb += this.addType(f, input);
      sb += ` ${publicName}) => ${privateName} = ${publicName};`;
      return sb;
    }).join('\n');
  }

  private defaultPrivateConstructor(input: Input): string {
    var sb = '';
    sb += `\t${this.name}({`;
    var i = 0;
    var len = Array.from(this.fields.keys()).length - 1;
    this.getFields((f) => {
      var publicName = f.getName(false);
      sb += this.addType(f, input);
      sb += ` ${publicName}`;
      if (i !== len) {
        sb += ', ';
      }
      i++;
    });
    sb += '}) {\n';
    this.getFields((f) => {
      var publicName = f.getName(false);
      var privateName = f.getName(true);
      sb += `this.${privateName} = ${publicName};\n`;
    });
    sb += '}';
    return sb;
  }

  private defaultConstructor(input: Input): string {
    let constructor = '';
    const values = this.fields.map((v) => v.typeDef);
    const defaultDate = defaultDateTime(this.fields, input);
    const isDefaultDate = defaultDate.length > 0;
    const areConstant = (typeDef: TypeDefinition) => {
      return typeDef.isDate && !typeDef.isList && typeDef.defaultValue;
    };
    const hasConstant = values.some(areConstant);
    const expression = (lines: number, tabs: number): string => {
      let sb = '';
      sb += '\t';
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
      constructor = expression(0, 0).replace(', });', '});');
    } else if (isDefaultDate) {
      // Force print block body for better format.
      // Block body with initialized non-constant values.
      constructor = expression(1, 2).replace('});', '})');
      constructor += printLine(`${defaultDate};`, 0, 1);
    } else {
      // Block body.
      constructor = expression(1, 2);
    }

    return constructor;
  }

  private jsonParseFunc(input: Input): string {
    const mapValue = input.jsonCodecs ? 'data' : 'json';
    const blockBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}`, 2, 1);
      sb += printLine(`.from${suffix(input)}(${jsonMapType(input)} ${mapValue}) {`);
      sb += printLine(`return ${this.name}(\n`, 1, 2);
      sb += this.getFields((f, k) => {
        // Check forced type for only not primitive type.
        const key = k.match('.') && !f.isList && f.type && !f.isPrimitive ? f.type : k;
        return `\t\t\t${joinAsClass(f.getName(this._privateFields), jsonParseValue(key, f, input))}`;
      }).join('\n');
      sb += printLine(');', 1, 2);
      sb += printLine('}\n\n', 1, 1);
      return sb;
    };

    const expressionBody = (): string => {
      let sb = '';
      sb += printLine(`factory ${this.name}`, 2, 1);
      sb += printLine(`.from${suffix(input)}(${jsonMapType(input)} ${mapValue}) => `);
      sb += printLine(`${this.name}(\n`);
      sb += this.getFields((f, k) => {
        // Check forced type for only not primitive type.
        const key = k.match('.') && !f.isList && f.type && !f.isPrimitive ? f.type : k;
        return `\t\t\t\t${joinAsClass(f.getName(this._privateFields), jsonParseValue(key, f, input))}`;
      }).join('\n');
      sb += printLine(');', 1, 3);
      return sb;
    };

    const line = expressionBody().substring(0, expressionBody().indexOf('(\n') + 1);

    return line.length > 78 ? blockBody() : expressionBody();
  }

  private toJsonFunc(input: Input): string {
    const _suffix = input.fromAndToSuffix;
    const suffix = input.jsonCodecs && _suffix.toLowerCase() === 'json' ? 'Map' : _suffix;
    const blockBody = (): string => {
      let sb = '';
      sb += printLine(`${jsonMapType(input)} to${suffix}() {`, 2, 1);
      sb += printLine('return {', 1, 2);
      this.getFields((f) => {
        sb += printLine(`${toJsonExpression(f, this._privateFields, input)}`, 1, 3);
      });
      sb += printLine('};', 0, 2);
      sb += printLine('}', 1, 1);
      return sb;
    };

    const expressionBody = (): string => {
      var sb = '';
      sb += printLine(`${jsonMapType(input)} to${suffix}() => {`, 2, 1);
      this.getFields((f) => {
        sb += printLine(`${toJsonExpression(f, this._privateFields, input)}`, 1, 4);
      });
      sb += printLine('};', 1, 3);
      return sb;
    };

    const line = expressionBody().substring(0, expressionBody().indexOf('{\n') + 1);

    return line.length > 80 ? blockBody() : expressionBody();
  }

  /**
   * Generate function for json_serializable and freezed.
   * @param freezed force to generate expression body (required for freezed generator).
   */
  private codeGenJsonParseFunc(input: Input): string {
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
    return expressionBody().length > 78 && !input.freezed
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

  private decodeFromJson(input: Input): string {
    if (!input.jsonCodecs) { return ''; }

    const comment = `
  /// \`dart:convert\`
  ///
  /// Parses the string and returns the resulting Json object as [${this.name}].`;
    let sb = '';
    sb += printLine(comment, 1);
    sb += printLine(`factory ${this.name}.fromJson(String data) {`, 1, 1);
    sb += printLine(`return ${this.name}.from${suffix(input)}(json.decode(data) as ${jsonMapType(input)});`, 1, 2);
    sb += printLine('}', 1, 1);
    return sb;
  }

  private encodeToJson(input: Input): string {
    if (!input.jsonCodecs) { return ''; }

    const comment = `
  /// \`dart:convert\`
  ///
  /// Converts [${this.name}] to a JSON string.`;
    let sb = '';
    sb += printLine(comment);
    sb += printLine(`String toJson() => json.encode(to${suffix(input)}());`, 1, 1);
    return sb;
  }

  /**
   * Generate copyWith(); mehtod for easier work with immutable classes.
   * @param {Input} input user input.
   */
  private copyWithMethod(input: Input): string {
    if (!input.copyWith) { return ''; }
    const values = this.fields.map((v) => v.typeDef);
    var sb = '';
    sb += printLine(`${this.name} copyWith({`, 2, 1);
    // Constructor objects.
    for (const value of values) {
      sb += printLine(`${this.addType(value, input)} ${value.name},`, 1, 2);
    }
    sb += printLine('}) {', 1, 1);
    sb += printLine(`return ${this.name}(`, 1, 2);
    // Return constructor.
    for (const value of values) {
      sb += printLine(`${value.name}: ${value.name} ?? this.${value.name},`, 1, 3);
    }
    sb += printLine(');', 1, 2);
    sb += printLine('}', 1, 1);
    return sb;
  }

  /**
   * `toString()` method in Dart language.
   * @param {boolean} print the string to be printed or no.
   * @param toString method should be generated or not.
   */
  private toStringMethod(print: boolean = false): string {
    if (!print) { return ''; }
    const values = this.fields.map((f) => f.typeDef);
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
   * @param {Input} input user input.
   */
  private equalityOperator(input: Input): string {
    if (input.equality !== 'Dart') { return ''; }

    const type = input.nullSafety ? 'Object' : 'dynamic';
    // const castType = input.nullSafety ? '' : ' as List';
    // const fields = this.fields.map((f) => f.typeDef).sort((a, b) => {
    //   return a.isList === b.isList ? 0 : a ? -1 : 1;
    // });
    let sb = '';
    // sb += printLine('@override', 2, 1);
    // sb += printLine(`bool operator ==(${type} other) {`, 1, 1);
    // sb += printLine('if (identical(other, this)) return true;', 1, 2);
    // sb += printLine(`if (other is! ${this.name}) return false;`, 1, 2);
    // sb += printLine('return ', 1, 2);
    // const printBlock = (lines: number = 1, tabs: number = 4): string => {
    //   let sb = '';
    //   for (let i = 0; i < fields.length; i++) {
    //     const isEnd = fields.length - 1 === i;
    //     const field = fields[i];
    //     const separator = isEnd ? ';' : ' &&';
    //     const _lines = i === 0 ? 0 : lines;
    //     const _tabs = i === 0 ? 0 : tabs;
    //     if (field.isList) {
    //       sb += printLine(`listEquals(other.${field.name}${castType}, ${field.name})`, _lines, _tabs);
    //       sb += separator;
    //     } else {
    //       sb += printLine(`other.${field.name} == ${field.name}`, _lines, _tabs);
    //       sb += separator;
    //     }
    //   }

    //   return sb;
    // };

    // if (printBlock().length < 76) {
    //   sb += printBlock(0, 0);
    // } else {
    //   sb += printBlock();
    // }

    // New test template...
    const typeCast = input.nullSafety ? '' : ' as Map';
    sb += printLine('@override', 2, 1);
    sb += printLine(`bool operator ==(${type} other) {`, 1, 1);
    sb += printLine('if (identical(other, this)) return true;', 1, 2);
    sb += printLine(`if (other is! ${this.name}) return false;`, 1, 2);
    sb += printLine('final mapEquals = const DeepCollectionEquality().equals;', 1, 2);
    sb += printLine(`return mapEquals(other.to${suffix(input)}()${typeCast}, to${suffix(input)}());`, 1, 2);
    // ent test template...
    sb += printLine('}', 1, 1);
    return sb;
  }

  private hashCode(input: Input): string {
    if (input.equality !== 'Dart') { return ''; }
    const fields = this.fields.map((f) => f.typeDef);
    const expressionBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('int get hashCode => ', 1, 1);
      fields.forEach((f, i, arr) => {
        const isEnd = arr.length - 1 === i;
        const separator = isEnd ? ';' : ' ^ ';
        sb += `${f.name}.hashCode`;
        sb += separator;
      });
      return sb;
    };
    const blockBody = (): string => {
      let sb = '';
      sb += printLine('@override', 2, 1);
      sb += printLine('int get hashCode =>', 1, 1);
      fields.forEach((f, i, arr) => {
        const isEnd = arr.length - 1 === i;
        const separator = isEnd ? ';' : ' ^';
        sb += printLine(`${f.name}.hashCode` + separator, 1, 3);
      });
      return sb;
    };
    const isShort = expressionBody().length < 91;
    return isShort ? expressionBody() : blockBody();
  }

  toCodeGenString(input: Input): string {
    var field = '';

    if (this.fields.length === 0) {
      field = emptyClass(this.name);
      return field;
    }

    if (input.freezed) {
      field += this.importsFromPackage(input);
      field += this.importList();
      field += this.importsForParts(input);
      field += this.freezedField(input);
      return field;
    } else {
      if (this._privateFields) {
        field += this.importsFromPackage(input);
        field += this.importList();
        field += this.importsForParts(input);
        field += '@JsonSerializable()\n';
        field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''}; {\n`;
        if (input.sortConstructorsFirst) {
          field += this.defaultPrivateConstructor(input) + '\n\n';
          field += this.fieldListCodeGen(input);
        } else {
          field += this.fieldListCodeGen(input) + '\n';
          field += this.defaultPrivateConstructor(input);
        }
        field += this.toStringMethod(input.isAutoOrToStringMethod);
        field += this.gettersSetters(input) + '\n\n';
        field += this.codeGenJsonParseFunc(input) + '\n\n';
        field += this.codeGenToJsonFunc();
        field += this.copyWithMethod(input);
        field += this.equalityOperator(input);
        field += this.hashCode(input);
        field += this.stringify(input.isAutoOrStringify);
        field += this.equatablePropList(input);
        field += '\n}\n'; // close class
        return field;
      } else {
        field += this.importsFromPackage(input);
        field += this.importList();
        field += this.importsForParts(input);
        field += '@JsonSerializable()\n';
        field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
        if (input.sortConstructorsFirst) {
          field += this.defaultConstructor(input) + '\n\n';
          field += this.fieldListCodeGen(input);
        } else {
          field += this.fieldListCodeGen(input) + '\n';
          field += this.defaultConstructor(input);
        }
        field += this.toStringMethod(input.isAutoOrToStringMethod);
        field += this.codeGenJsonParseFunc(input) + '\n\n';
        field += this.codeGenToJsonFunc();
        field += this.copyWithMethod(input);
        field += this.equalityOperator(input);
        field += this.hashCode(input);
        field += this.stringify(input.isAutoOrStringify);
        field += this.equatablePropList(input);
        field += '\n}\n'; // close class
        return field;
      }
    }
  }

  toString(input: Input): string {
    var field = '';

    if (this.fields.length === 0) {
      field = emptyClass(this.name);
      return field;
    }

    if (this._privateFields) {
      field += this.dartImports(input);
      field += this.importsFromPackage(input);
      field += this.importList();
      field += this.importsForParts(input);
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
      if (input.sortConstructorsFirst) {
        field += this.defaultPrivateConstructor(input) + '\n\n';
        field += this.fieldList(input);
      } else {
        field += this.fieldList(input) + '\n\n';
        field += this.defaultPrivateConstructor(input);
      }
      field += this.toStringMethod(input.isAutoOrToStringMethod);
      field += this.gettersSetters(input) + '\n\n';
      field += this.jsonParseFunc(input) + '\n\n';
      field += this.toJsonFunc(input);
      field += this.copyWithMethod(input);
      field += this.equalityOperator(input);
      field += this.hashCode(input);
      field += this.stringify(input.isAutoOrStringify);
      field += this.equatablePropList(input);
      field += '\n}\n'; // close class
      return field;
    } else {
      field += this.dartImports(input);
      field += this.importsFromPackage(input);
      field += this.importList();
      field += this.importsForParts(input);
      field += `${input.immutable ? '@immutable\n' : ''}`;
      field += `class ${this.name}${input.equatable ? ' extends Equatable' : ''} {\n`;
      if (input.sortConstructorsFirst) {
        field += this.defaultConstructor(input) + '\n\n';
        field += this.fieldList(input);
      } else {
        field += this.fieldList(input) + '\n\n';
        field += this.defaultConstructor(input);
      }
      field += this.toStringMethod(input.isAutoOrToStringMethod);
      field += this.jsonParseFunc(input);
      field += this.toJsonFunc(input);
      field += this.decodeFromJson(input);
      field += this.encodeToJson(input);
      field += this.copyWithMethod(input);
      field += this.equalityOperator(input);
      field += this.hashCode(input);
      field += this.stringify(input.isAutoOrStringify);
      field += this.equatablePropList(input);
      field += '\n}\n'; // close class
      return field;
    }
  }
}
