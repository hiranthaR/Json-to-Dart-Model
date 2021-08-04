import * as fs from "fs";

import { window } from "vscode";
import { getWorkspaceRoot } from "../utils";

function updatePubspec(path: string, data: string) {
    fs.writeFile(path, data.toString(), "utf8", (error) => {
        if (error) {
            window.showErrorMessage('Error updating pubspec.yaml file.');
            return;
        }
    });
}

/**
 * Returns pubspec context with missing dependencies.
 * @param {string} data pubspec context.
 * @param {Map<string, boolean>} dependencies requred dependencies that must be implemented.
 * @returns new pubspec context.
 */
async function appendDependencies(
    data: string,
    dependencies: Map<string, boolean>,
): Promise<string> {
    let pubspec = data;
    const keyword = "sdk: flutter";

    for await (const [name, isDev] of dependencies) {
        let dependency = `\n  ${name}`;

        while (!pubspec.includes(dependency)) {
            let index = pubspec.indexOf(
                keyword,
                isDev ?
                    1 + pubspec.indexOf(keyword) :
                    pubspec.indexOf(keyword)
            );

            if (index > 0) {
                pubspec =
                    pubspec.substring(0, index + keyword.length) +
                    dependency +
                    pubspec.substring(index + keyword.length, pubspec.length);
            }

            if (pubspec.includes(dependency)) {
                break;
            }
        }
    }

    return pubspec;
}

/**
 * Implement all missing dependencies.
 * * non-existing dependencies will be implemented by [appendDependencies]
 * @param {string} path the file path ex: `targetPath/pubspec.yaml`.
 */
async function appendPubspecDependencies(path: string) {
    // Get pubspec context.
    let pubspec = fs.readFileSync(path, "utf8");
    // All supported dependencies that are recommended to implement.
    // boolean indicates implement to the `dev_dependencies` or `dependencies`.
    const dependencies = new Map<string, boolean>([
        ["freezed_annotation:", false],
        ["json_annotation:", false],
        ["equatable:", false],
        ["freezed:", true],
        ["build_runner:", true],
        ["json_serializable:", true],
    ]);

    if (Array.from(dependencies.keys()).every((k) => pubspec.includes(k))) {
        const text = 'You have all compatible dependencies';
        window.showInformationMessage(text);
        return;
    }
    // Add missing dependencies.
    pubspec = await appendDependencies(pubspec, dependencies);
    updatePubspec(path, pubspec);
}

/**
 * Adds all missing code generation libraries.
 */
export async function addCodeGenerationLibraries() {
    const workspaceRoot = getWorkspaceRoot();
    const pubspecPath = `${workspaceRoot}/pubspec.yaml`;

    if (fs.existsSync(pubspecPath)) {
        await appendPubspecDependencies(pubspecPath);
    } else {
        window.showErrorMessage("pubspec.yaml does't exist :/");
    }
}