import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

import { getWorkspaceRoot } from './get-workspace-root';
import { window } from 'vscode';

type WriteFileOptions = { showError?: string, showInfo?: string };

export class FileManager {

    get workspaceRoot() {
        return getWorkspaceRoot();
    }

    /**
     * Creates a path securely by automatically adding the root path of the workspace if it is missing.
     * @param {string} path A path to a file or directory.
     * @returns A string.
     */
    safePath(path: string): string {
        const root = `${this.workspaceRoot}`;
        return path.startsWith(root) ? path : `${root}${path}`;
    }

    existsSync(path: string): boolean {
        return fs.existsSync(this.safePath(path));
    }

    /**
     * Reads directory and return string list with file names.
     * - If the path does not exist or the directory is empty returns an empty list.
     */
    readDirectory(dir: string): string[] {
        try {
            return fs.readdirSync(this.safePath(dir), 'utf-8');
        } catch (_) {
            return [];
        }
    }

    /**
     * Removes all existing files in the directory and remove the empty directory.
     * - Workspace root path not required.
     */
    removeDirectory(dir: string): void {
        if (!this.existsSync(dir)) { return; }

        const entries = this.readDirectory(dir);
        const directory = this.safePath(dir);

        if (entries.length > 0) {
            for (const file of entries) {
                const path = `${directory}/${file}`;
                this.removeFile(path);
            }
        }

        fs.rmdirSync(directory);
    }

    createDirectory(dir: string): Promise<void> {
        const path = this.safePath(dir);

        return new Promise(async (resolve, reject) => {
            await mkdirp(path)
                .then((_) => resolve())
                .catch((err) => reject(err));
        });
    }

    removeFile(path: string): void {
        const dir = this.safePath(path);
        fs.unlinkSync(dir);
    }

    readFile(path: string): string {
        const dir = this.safePath(path);
        const data = fs.readFileSync(dir, 'utf-8');
        return data;
    }

    writeFile(path: string, data: string, options?: WriteFileOptions) {
        const dir = this.safePath(path);

        return new Promise<void>((resolve, reject) => {
            fs.writeFile(dir, data, 'utf8', (err) => {
                if (err) {
                    if (options?.showError) {
                        window.showErrorMessage(options.showError);
                    } else {
                        reject(err);
                    }
                } else {
                    if (options?.showInfo) {
                        window.showInformationMessage(options.showInfo);
                    }
                    resolve();
                }
            });
        });
    }
}

export const fm = new FileManager();