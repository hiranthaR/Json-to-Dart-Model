import * as fs from 'fs';

import { getWorkspaceRoot } from '../utils';
import { window } from 'vscode';


class Pubspec {
    readonly data: string;
    readonly path: string;
    readonly dependencies = new Map<string, boolean>([
        ['freezed_annotation', false],
        ['json_annotation', false],
        ['equatable', false],
        ['freezed', true],
        ['build_runner', true],
        ['json_serializable', true],
    ]);

    constructor() {
        const workspaceRoot = getWorkspaceRoot();
        this.path = `${workspaceRoot}/pubspec.yaml`;
        this.data = this.getData;
    }

    get getData(): string {
        if (this.exsist) {
            // Get pubspec context.
            return fs.readFileSync(this.path, 'utf8');
        } else {
            return '';
        }
    }

    get exsist(): boolean {
        return fs.existsSync(this.path);
    }

    get hasData(): boolean {
        return this.data.length > 0;
    }

    /**
     * Returns dependency version.
     * @param {string} dependency name ex: freezed_annotation
     * @returns number as a string ex: '0.14.3'
     */
    getDependencyVersion(dependency: string): string | undefined {
        const name = `${dependency}:`;

        if (this.exsist) {
            // Get pubspec context.
            if (this.data.includes(name)) {
                const index = this.data.indexOf(name);
                return this.data.substr(index, 16).slice(-6);
            }
        }
    }

    /**
     * Implement all missing dependencies.
     *  * [dependencies] key must be ex: json_annotation
     *  * [dependencies] value `true` implements to the`dev_dependencies` content and `false` to the `dependencies` content.
     * @param {Map<string, boolean>} dependencies requred dependencies that must be implemented.
     */
    async appendPubspecDependencies(dependencies: Map<string, boolean>) {
        let data = this.getData;

        if (!(data.length > 0)) {
            const text = 'Failed to read pubspec.yaml file';
            window.showErrorMessage(text);
            return;
        }

        // Check if all dependencies exist.
        if (Array.from(dependencies.keys()).every((k) => data.includes(k))) {
            const text = 'You have all compatible dependencies';
            window.showInformationMessage(text);
            return;
        }
        // Add missing dependencies.
        data = await appendDependencies(data, dependencies);
        updatePubspec(this.path, data);
    }

    async addCodeGenerationLibraries() {
        await pubspec.appendPubspecDependencies(this.dependencies);
    }
}


function updatePubspec(path: string, data: string) {
    fs.writeFile(path, data.toString(), 'utf8', (error) => {
        if (error) {
            window.showErrorMessage('Error updating pubspec.yaml file.');
            return;
        }
    });
}

/**
 * Returns pubspec context with missing dependencies.
 *  * [dependencies] key must be ex: json_annotation
 *  * [dependencies] value `true` implements to the`dev_dependencies` content and `false` to the `dependencies` content.
 * @param {string} data pubspec context.
 * @param {Map<string, boolean>} dependencies requred dependencies that must be implemented.
 * @returns new pubspec context.
 */
async function appendDependencies(
    data: string,
    dependencies: Map<string, boolean>,
): Promise<string> {
    let pubspec = data;
    const keyword = 'sdk: flutter';

    for await (const [name, isDev] of dependencies) {
        const dependency = `\n  ${name}:`;

        while (!pubspec.includes(dependency)) {
            const index = pubspec.indexOf(
                keyword,
                isDev ?
                    1 + pubspec.indexOf(keyword) :
                    pubspec.indexOf(keyword)
            );

            if (index > 0) {
                pubspec =
                    pubspec.substring(0, index + keyword.length) +
                    dependency +
                    ' any' +
                    pubspec.substring(index + keyword.length, pubspec.length);
            }

            if (pubspec.includes(dependency)) {
                break;
            }
        }
    }

    return pubspec;
}

export const pubspec = new Pubspec();