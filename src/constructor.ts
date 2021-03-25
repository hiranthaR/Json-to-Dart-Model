import { ASTNode } from "json-to-ast";
import { getListSubtype, getTypeName, isASTLiteralDouble, isList, isPrimitiveType, snakeCase } from "./helper";
import * as _ from "lodash";

interface TypeDefinitionInterface {
  /**
   * Object patch name. Used for imports.
   *  * If the name is null, it means no need to print.
   */
  importName: string | null;
  /** JSON object key. */
  jsonKey: string;
  /**
   * The name of the object. Represents as class name.
   *  * The names are completely formatted to Dart syntax.
   */
  className: string;
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
  /** The value from the json object. */
  value: any;
  /** The ambiguous object or not. */
  isAmbiguous: boolean;
  /** If the value is primitive, returns true. */
  isPrimitive: boolean;
  /** If the value type is DateTime, returns true. */
  isDate: boolean;
  /** If the value type is List, returns true. */
  isList: boolean;
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
}

/**
 * A class that holds all the information about the object.
 * * Every type are formatted and ready for printing to string.
 */
export class TypeDefinition implements TypeDefinitionInterface {
  private _importName: string | null;
  jsonKey: string;
  className: string;
  type: string | null;
  name: string;
  value: any;
  isAmbiguous = false;
  isPrimitive = false;
  isDate = false;
  isList = false;

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
    this.jsonKey = jsonKey;
    this.className = className;
    this.type = type;
    this.name = name;
    this.value = value;
    this.isAmbiguous = isAmbiguous;
    if (type !== null) {
      this.isPrimitive = isPrimitiveType(type);
      if (name === "int" && isASTLiteralDouble(astNode)) {
        this.name = "double";
      }
      if (type.includes("DateTime")) {
        this.isDate = true;
      }
      if (isList(type)) {
        this.isList = true;
      }
    }
    if (isAmbiguous === null) {
      isAmbiguous = false;
    }
  }

  get importName() {
    return this._importName;
  }

  getName(isPrivate: boolean = false): string {
    return isPrivate ? `_${this.name}` : this.name;
  }

  updateImport(name: string) {
    if (!this.isPrimitive) {
      this._importName = snakeCase(name);
    } else {
      throw new Error(`TypeDefinition: Primitive objects cannot be imported and cannot be updated`);
    }
  }

  hasValue(other: any): boolean {
    return _.isEqual(this.value, other);
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
    return new TypeDefinition(
      null, "", "", elemType, type, obj, isAmbiguous, astNode
    );
  }
  return new TypeDefinition(
    null, "", "", type, "", obj, isAmbiguous, astNode
  );
}