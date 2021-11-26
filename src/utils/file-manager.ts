import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

import { workspaceFolders, getWorkspaceRoot } from './workspace';
import { window } from 'vscode';
import { isWin } from './constants';

type WriteFileOptions = { showError?: string, showInfo?: string };

export class FileManager {

    /** The path for reading directory. */
    get workspaceRoot() {
        const root = getWorkspaceRoot();

        if (isWin) {
            return root?.startsWith('/') ? root.substring(1) : root;
        }

        return root;
    }

    get isOpenWorkspace() {
        return workspaceFolders()[0] !== undefined;
    }

    /** The path for reading files. */
    get fsPath() {
        const fsPath = workspaceFolders()[0].uri.fsPath;

        if (isWin) {
            return fsPath?.startsWith('/') ? fsPath.substring(1) : fsPath;
        }

        return fsPath;
    }

    existsSync(path: string): boolean {
        return fs.existsSync(path);
    }

    /**
     * Reads directory and return string list with file names.
     * - If the path does not exist or the directory is empty returns an empty list.
     */
    readDirectory(dir: string): string[] {
        try {
            return fs.readdirSync(dir, 'utf-8');
        } catch (_) {
            return [];
        }
    }

    /**
     * Removes all existing files in the directory and remove the empty directory.
     */
    removeDirectory(dir: string): void {
        if (!this.existsSync(dir)) { return; }

        const entries = this.readDirectory(dir);

        if (entries.length > 0) {
            for (const file of entries) {
                const f = path.join(dir, file);
                this.removeFile(f);
            }
        }

        fs.rmdirSync(dir);
    }

    createDirectory(dir: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await mkdirp(dir)
                .then((_) => resolve())
                .catch((err) => reject(new Error(`Couldn't create directory due to error: ${err}`)));
        });
    }

    removeFile(path: string): void {
        fs.unlinkSync(path);
    }

    readFile(path: string): string {
        return fs.readFileSync(path, 'utf-8');
    }

    writeFile(path: string, data: string, options?: WriteFileOptions) {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, data, 'utf8', (err) => {
                if (err) {
                    if (options?.showError) {
                        window.showErrorMessage(options.showError);
                    } else {
                        reject(new Error(`Couldn't create file due to error: ${err}`));
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

export function toPosixPath(pathLike: string): string {

    if (pathLike.includes(path.win32.sep)) {
        return pathLike.split(path.win32.sep).join(path.posix.sep);
    }

    return pathLike;
}

export const fm = new FileManager();