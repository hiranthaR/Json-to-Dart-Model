import * as _ from 'lodash';

import {
  getListSubtype,
  getTypeName,
  isASTLiteralDouble,
  isList,
  isPrimitiveType,
  pascalCase,
  snakeCase
} from './utils';
import { ASTNode } from 'json-to-ast';

interface TypeDefinitionProperties {
  /**
   * Object patch name. Used for imports.
   *  * If the name is null, it means no need to print.
   */
  importName: string | null;
  /**
   * JSON object key. 
   */
  jsonKey: string;
  /**
   * It's the objects constructor name. Represents as class name.
   *  * Used to rename duplicate structures.
   *  * The names are completely formatted to Dart syntax.
   */
  prefix: string;
  /**
  * The object type.
  *  * Type are completely formatted to Dart syntax.
  */
  type: string | null;
  /**
  * The object name.
  *  * The name are completely formatted to Dart syntax.
  */
  name: string;
  /** 
   * The value from the json object.
   */
  value: any;
  /**
   * The ambiguous object or not.
   */
  isAmbiguous: boolean;
  /**
   * If the value is primitive, returns true. 
   */
  isPrimitive: boolean;
  /** 
   * If the value type is DateTime, returns true.
   */
  isDate: boolean;
  /** 
   * If the value type is List, returns true.
   */
  isList: boolean;
  /** 
   * If it's true the value is marked as required.
   */
  required: boolean;
  /** 
  * If it's true the JSON value is marked as default.
  */
  defaultValue: boolean;
  /**
   * Get name of value.
   * @param {boolean} isPrivate returns as private or not.
   */
  getName(isPrivate: boolean): string;
  /**
   * Update the name of the import.
   * * WARNING: Be careful by renaming the import
   *   it is very sensitive and important for generating the result.
   * @param {string} name new import name.
   */
  updateImport(name: string): void;
  /**
   * Returns true if the value is equal.
   * @param other a value to compare.
   */
  hasValue(other: any): boolean;
  /**
   * A function that returns raw JSON key by cleaning some annotations added by the user
   * and marks properties according to the user's preferences.
   * 
   *  * Possible returns with forced type or original, ex: `orginal.forced_type`. To separate key, use [handleJsonValue]
   * 
   * @param {string} key a key to be processed.
   * @returns string value.
   */
  filteredKey(key: string): string;
  /**
   * Indicates or object is `null`,
   */
  nullable: boolean;
}

/**
 * A class that holds all the information about the object.
 * * Every type are formatted and ready for printing to string.
 */
export class TypeDefinition implements TypeDefinitionProperties {
  private _importName: string | null;
  jsonKey: string;
  prefix: string;
  type: string | null;
  name: string;
  value: any;
  isAmbiguous = false;
  isPrimitive = false;
  isDate = false;
  isList = false;
  required = false;
  defaultValue = false;
  nullable = true;

  constructor(
    importName: string | null,
    jsonKey: string,
    className: string,
    type: string | null,
    name: string,
    value: any,
    isAmbiguous: boolean,
    astNode: ASTNode,
  ) {
    this._importName = importName;
    this.jsonKey = this.filteredKey(jsonKey);
    this.prefix = className;
    this.type = type;
    this.name = name;
    this.value = value;
    this.isAmbiguous = isAmbiguous;
    if (type !== null) {
      this.isPrimitive = isPrimitiveType(type);
      if (name === 'int' && isASTLiteralDouble(astNode)) {
        this.name = 'double';
      }
      if (type.includes('DateTime')) {
        this.isDate = true;
      }
      if (isList(type)) {
        this.isList = true;
      }
      if (type === 'dynamic') {
        this.nullable = false;
      }
    }
    if (isAmbiguous === null) {
      isAmbiguous = false;
    }
  }

  get importName() {
    return this._importName;
  }

  filteredKey(key: string): string {
    const search = /([^]@)/gi;
    const replace = '';

    if (key.match(/d@/gi)) {
      this.defaultValue = true;
    }
    if (key.match(/r@/gi)) {
      this.required = this.defaultValue ? false : true;
    }

    if (this.defaultValue || this.required) {
      this.nullable = false;
    }

    this.jsonKey = key.replace(search, replace);

    return this.jsonKey;
  }

  getName(isPrivate: boolean = false): string {
    return isPrivate ? `_${this.name}` : this.name;
  }

  updateImport(name: string) {
    if (!this.isPrimitive) {
      this._importName = snakeCase(name);
    } else {
      throw new Error('TypeDefinition: import can\'t be added to a primitive object.');
    }
  }

  updateObjectType(name: string) {
    if (!this.isPrimitive) {
      this.type = pascalCase(name);
    } else {
      throw new Error('TypeDefinition: primitive objects can\'t be updated.');
    }
  }

  hasValue(other: any): boolean {
    return _.isEqual(this.value, other);
  }
}

export function typeDefinitionFromAny(obj: any, astNode: ASTNode) {
  var isAmbiguous = false;
  var type: string = getTypeName(obj);

  if (type === 'List') {
    var list = obj;
    var elemType: string = getListSubtype(list);
    if (elemType !== getListSubtype(list)) {
      isAmbiguous = true;
    }
    return new TypeDefinition(
      null, '', '', elemType, type, obj, isAmbiguous, astNode
    );
  }
  return new TypeDefinition(
    null, '', '', type, '', obj, isAmbiguous, astNode
  );
}