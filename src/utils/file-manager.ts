import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

import { fsPath, getWorkspaceRoot } from './workspace';
import { window } from 'vscode';

type WriteFileOptions = { showError?: string, showInfo?: string };

export class FileManager {

    /** The path for reading directory. */
    get workspaceRoot() {
        return getWorkspaceRoot();
    }

    /** The path for reading files. */
    get fsPath() {
        return fsPath();
    }

    /**
     * Creates a path securely by automatically adding the root path of the workspace if it is missing.
     * @param {string} path A path to a file or directory.
     * @returns A string.
     */
    safeRootPath(path: string): string {
        const root = `${this.workspaceRoot}`;
        return path.startsWith(root) ? path : `${root}${path}`;
    }

    safeFsPath(path: string): string {
        const fsPath = `${this.fsPath}`;
        return path.startsWith(fsPath) ? path : `${fsPath}${path}`;
    }

    existsSync(path: string): boolean {
        return fs.existsSync(this.safeFsPath(path));
    }

    /**
     * Reads directory and return string list with file names.
     * - If the path does not exist or the directory is empty returns an empty list.
     */
    readDirectory(dir: string): string[] {
        try {
            return fs.readdirSync(this.safeRootPath(dir), 'utf-8');
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
        const directory = this.safeRootPath(dir);

        if (entries.length > 0) {
            for (const file of entries) {
                const path = `${directory}/${file}`;
                this.removeFile(path);
            }
        }

        fs.rmdirSync(directory);
    }

    createDirectory(dir: string): Promise<void> {
        const path = this.safeRootPath(dir);

        return new Promise(async (resolve, reject) => {
            await mkdirp(path)
                .then((_) => resolve())
                .catch((err) => reject(err));
        });
    }

    removeFile(path: string): void {
        const dir = this.safeFsPath(path);
        fs.unlinkSync(dir);
    }

    readFile(path: string): string {
        const dir = this.safeFsPath(path);
        const data = fs.readFileSync(dir, 'utf-8');
        return data;
    }

    writeFile(path: string, data: string, options?: WriteFileOptions) {
        const dir = this.safeFsPath(path);

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