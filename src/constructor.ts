import { ASTNode } from "json-to-ast";
import { getListSubtype, getTypeName, isASTLiteralDouble, isList, isPrimitiveType } from "./helper";

interface TypeDefinitionInterface {
  /**
   * Object patch name. Used for imports.
   *  * If the name is null, it means no need to print.
   */
  importName: string | null;
  /**
   * JSON object key.
   */
  jsonKey: string | null;
  /**
   * The name of the object constructor.
   *  * The names are completely formatted to Dart syntax.
   *  * On primitive objects is null and represents as class names.
   */
  constructorName: string | null;
  /**
   * The name of the object. Represents as class name.
   *  * The names are completely formatted to Dart syntax.
   */
  className: string | null;
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
   * if the value is primitive, returns true.
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
   * Get name of value.
   * @param isPrivate returns as private or not.
   */
  getName(isPrivate: boolean): string;
  /**
   * Update the name of the import.
   * @param name rename import.
   */
  updateImportName(name: string): void;
}

/**
 * A class that holds all the information about the object.
 * * Every type are formatted and ready for printing to string.
 */
export class TypeDefinition implements TypeDefinitionInterface {
  importName: string | null;
  jsonKey: string | null;
  constructorName: string | null;
  className: string | null;
  type: string | null;
  name: string;
  value: any;
  isAmbiguous = false;
  isPrimitive = false;
  isDate = false;
  isList = false;

  constructor(
    importName: string | null,
    jsonKey: string | null,
    constructor: string | null,
    className: string | null,
    type: string | null,
    name: string,
    value: any,
    isAmbiguous: boolean,
    astNode: ASTNode,
  ) {
    this.importName = importName;
    this.jsonKey = jsonKey;
    this.constructorName = constructor;
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

  getName(isPrivate: boolean = false): string {
    return isPrivate ? this.name = "_" + this.name : this.name;
  }

  updateImportName(name: string) {
    this.importName = name;
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
    return new TypeDefinition(null, null, null, null, elemType, type, obj, isAmbiguous, astNode);
  }
  return new TypeDefinition(null, null, null, null, type, "", obj, isAmbiguous, astNode);
}