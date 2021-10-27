import parse = require('json-to-ast');
import * as _ from 'lodash';

import { ClassDefinition, Dependency, Warning, WithWarning, newAmbiguousListWarn, newEmptyListWarn } from './syntax';
import { TypeDefinition, typeDefinitionFromAny } from './constructor';
import { cleanKey, fixFieldName, mergeObjectList, navigateNode, pascalCase } from './utils';
import { isArray, parseJSON } from './lib';
import { ASTNode } from 'json-to-ast';
import { ISettings } from './settings';

var pluralize = require('pluralize');

class DartCode extends WithWarning<string> {
    constructor(result: string, warnings: Warning[]) {
        super(result, warnings);
    }
    getCode() { return this.result; }
}

type InputKeyName = {
    name: string;
    type: string | null;
};

export function inputKeyNameHandler(key: string): InputKeyName {
    if (key.match('.') && key[0] !== '.') {
        const name = key.split('.').shift() ?? key;
        const type = key.split('.').pop() ?? null;

        return { name: name, type: type };
    } else {
        return { name: key, type: null };
    }
}

export class Hint {
    path: string;
    type: string;

    constructor(path: string, type: string) {
        this.path = path;
        this.type = type;
    }
}

export class ModelGenerator {
    private settings: ISettings;
    private rootClassName: string;
    private privateFields: boolean;
    private allClasses: ClassDefinition[] = [];
    private allClassMapping = new Map<ClassDefinition, Dependency>();
    hints: Hint[];

    constructor(settings: ISettings, privateFields = false, hints: Hint[] | null = null) {
        this.settings = settings;
        this.rootClassName = settings.model.className;
        this.privateFields = privateFields;
        if (hints !== null) {
            this.hints = hints;
        } else {
            this.hints = new Array<Hint>();
        }
    }

    get duplicates(): ClassDefinition[] {
        const getPath = (c: ClassDefinition): string => c.path;
        const duplicatesOnly = (v: string, i: number, arr: string[]) => arr.indexOf(v) !== i;
        const paths = this.allClasses.map(getPath).filter(duplicatesOnly) || [];
        return this.allClasses.filter((c) => paths.includes(c.path)) || [];
    }

    private hintForPath(path: string): Hint {
        return this.hints.filter((h) => h.path === path)[0];
    }

    private generateClassDefinition(args: {
        className: string,
        object: any,
        path: string,
        astNode: ASTNode,
    }): Warning[] {
        const warnings = new Array<Warning>();
        if (isArray(args.object)) {
            // if first element is an array, start in the first element.
            const node = navigateNode(args.astNode, '0');
            this.generateClassDefinition({
                className: args.className,
                object: args.object[0],
                path: args.path,
                astNode: node,
            });
        } else {
            const jsonRawData: Map<string, any> = new Map(Object.entries(args.object));
            // Override the model class name with a new one.
            this.settings.model.className = args.className;
            // Create a new class definition by new parameters.
            const classDefinition = new ClassDefinition(this.settings.model, this.privateFields);
            const _className = pascalCase(args.className);
            jsonRawData.forEach((value, key) => {
                let typeDef: TypeDefinition;
                const hint = this.hintForPath(`${args.path}/${cleanKey(key)}`);
                const node = navigateNode(args.astNode, cleanKey(key));
                if (hint !== null && hint !== undefined) {
                    typeDef = new TypeDefinition(
                        null, key, _className, null, hint.type, value, false, node
                    );
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }

                // returns JSON key without annotation but with forced type or original.
                let name = typeDef.filteredKey(key);
                // Force key name by user if available.
                typeDef.name = fixFieldName(inputKeyNameHandler(name).name, args.className);
                typeDef.value = value;
                typeDef.prefix = _className;
                if (typeDef.type !== null) {
                    // Restore original JSON key.
                    typeDef.jsonKey = inputKeyNameHandler(name).name;

                    if (!typeDef.isPrimitive) {
                        // Force key type by user if available.
                        const type = pascalCase(inputKeyNameHandler(name).type ?? name);
                        typeDef.updateImport(type);

                        if (typeDef.isList) {
                            // Convert plural class names to singular.
                            const singularName = pluralize.singular(type);
                            // Rename plural class names.
                            typeDef.type = typeDef.type?.replace('Class', singularName);
                            typeDef.updateImport(singularName);
                            name = singularName;
                        } else {
                            typeDef.type = type;
                        }
                    }
                }

                if (typeDef.type === null) {
                    warnings.push(newEmptyListWarn(`${args.path}/${name}`));
                }
                if (typeDef.isAmbiguous) {
                    warnings.push(newAmbiguousListWarn(`${args.path}/${name}`));
                }

                classDefinition.addField(name, typeDef);
            });
            // Push new created class definition.
            this.allClasses.push(classDefinition);
            const dependencies = classDefinition.dependencies;
            let warns: Warning[];
            dependencies.forEach((dependency) => {
                if (dependency.typeDef.type !== null && dependency.typeDef.isList) {
                    // only generate dependency class if the array is not empty
                    if (dependency.typeDef.value.length > 0) {
                        // when list has ambiguous values, take the first one, otherwise merge all objects
                        // into a single one
                        let toAnalyze;
                        if (!dependency.typeDef.isAmbiguous) {
                            const mergeWithWarning = mergeObjectList(
                                dependency.typeDef.value, `${args.path}/${dependency.name}`
                            );
                            toAnalyze = mergeWithWarning.result;
                            mergeWithWarning.warnings.forEach((wrn) => warnings.push(wrn));
                        } else {
                            toAnalyze = dependency.typeDef.value[0];
                        }
                        const obj: any = {};
                        toAnalyze.forEach((value: any, key: any) => obj[key] = value);
                        const node = navigateNode(args.astNode, dependency.name);
                        warns = this.generateClassDefinition({
                            className: dependency.className,
                            object: obj,
                            path: `${args.path}/${dependency.name}`,
                            astNode: node,
                        });
                    }
                } else {
                    const node = navigateNode(args.astNode, inputKeyNameHandler(dependency.name).name);
                    warns = this.generateClassDefinition({
                        className: dependency.typeDef.type ?? dependency.className,
                        object: jsonRawData.get(dependency.name),
                        path: `${args.path}/${inputKeyNameHandler(dependency.name).name}`,
                        astNode: node,
                    });
                }
                if (warns !== null && warns !== undefined) {
                    warns.forEach(wrn => warnings.push(wrn));
                }
            });
        }

        return warnings;
    }

    private async mergeDefinitions(arr: Array<[ClassDefinition, Dependency]>) {
        for (let i = 0; i < arr.length; i++) {
            const cd = arr[i][0];
            const d = arr[i][1];
            const paths = arr.map((c) => c[0].path);
            const count: any = {};

            if (paths.indexOf(cd.path) !== i) {
                const p = cd.path;
                const c = p in count ? count[p] = count[p] + 1 : count[p] = 1;
                let idx = c;
                // A class name for duplicate object.
                const prefix = d.typeDef.prefix + '_';
                let path = prefix + p;

                if (paths.indexOf(path) === -1) {
                    cd.updatePath(path);
                    d.typeDef.updateImport(path);
                }

                while (paths.indexOf(path) !== -1) {
                    //If it continues to duplicate, add index.
                    path = prefix + p + `_${idx++}`;
                }
                // Create file path for objects.
                cd.updatePath(path);
                // Navigate object to file.
                d.typeDef.updateImport(path);
            }
        }
    }

    /** Returns class definition equal to the dependency.
     * 
     * * Duplicate definitions will be overridden and identical
     *   which later will be removed as duplicate key in the `allClassMapping`
     */
    private async sortByDependency(dependency: Dependency): Promise<ClassDefinition | undefined> {
        let classDef;
        const path = dependency.typeDef.importName;
        const field = dependency.typeDef;
        // eslint-disable-next-line prefer-const
        classDef = this.allClasses.find((c) => {
            if (path === null) {
                return false;
            }

            return c.hasPath(path) && c.hasField(field);
        });
        if (classDef === undefined) {
            console.debug('ModelGenerator: sortByDependency => found undefined object');
        }
        return classDef;
    }

    /** Returns definition by dependencies and ready to produce. */
    private getDefinitionByDependency(
        dependency: Dependency,
        callbackfn: (classDefinition: ClassDefinition, dependency: Dependency, index: number) => void
    ) {
        for (let i = 0; i < this.allClasses.length; i++) {
            const c = this.allClasses[i];
            const field = dependency.typeDef;
            const value = dependency.typeDef.value;

            if (c.hasField(field) && c.hasEqualField(value)) {
                return callbackfn(c, dependency, i);
            }
        }
    }

    private updateDependecies(key: ClassDefinition, dependency: Dependency) {
        for (const c of this.allClasses) {
            for (const d of c.dependencies) {
                const path = dependency.typeDef.importName;
                const value = dependency.typeDef.value;
                const prefix = this.allClassMapping.get(key)?.typeDef.prefix + '_';

                if (d.typeDef.importName === path && d.typeDef.hasValue(value)) {
                    d.typeDef.updateImport(prefix + path);
                }
            }
        }
    }

    private async handleDuplicates() {
        const paths = this.allClasses.map((cd) => cd.path);

        for await (const definition of this.allClasses) {
            for (const dependency of definition.dependencies) {
                if (definition.name.toLowerCase() === this.rootClassName.toLowerCase()) {
                    this.allClassMapping.set(definition, dependency);
                }
                const classDef = await this.sortByDependency(dependency);
                if (classDef !== undefined) {
                    if (this.duplicates.includes(classDef)) {
                        // Convert definitions back.
                        this.getDefinitionByDependency(dependency, (c, d, i) => {
                            if (!this.allClassMapping.has(c)) {
                                this.allClassMapping.set(c, d);
                            }

                            if (paths.indexOf(c.path) !== i) {
                                // Update all existing dependencies.
                                this.updateDependecies(c, d);
                            }
                        });
                    } else {
                        this.allClassMapping.set(classDef, dependency);
                    }
                }
            }
        }

        const definitions = Array.from(this.allClassMapping);
        definitions.sort((a, b) => a[0].name.localeCompare(b[0].name));
        this.mergeDefinitions(definitions);
    }

    /// generateUnsafeDart will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. The dart code is not validated so invalid dart code
    /// might be returned
    private async generateUnsafeDart(rawJson: string): Promise<ClassDefinition[]> {
        const jsonRawData = parseJSON(rawJson);
        const astNode = parse(rawJson, {
            loc: true,
            source: undefined
        });

        const warnings: Warning[] = this.generateClassDefinition({
            className: this.rootClassName,
            object: jsonRawData,
            path: '',
            astNode: astNode,
        });

        // After generating all classes, merge similar classes with paths.
        //
        // If duplicates are detected create a new path.
        //TODO: fix duplicates handling.
        // if (this.duplicates.length) {
        //     await this.handleDuplicates();
        //     return Array.from(this.allClassMapping.keys());
        // } else {
        //     return this.allClasses;
        // }

        return this.allClasses;
    }

    /// generateDartClasses will generate all classes and append one after another
    /// in a single string. The [rawJson] param is assumed to be a properly
    /// formatted JSON string. If the generated dart is invalid it will throw an error.
    generateDartClasses(rawJson: string): Promise<ClassDefinition[]> {
        return this.generateUnsafeDart(rawJson);
    }
}
