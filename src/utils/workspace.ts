import * as vscode from 'vscode';

/** The path for reading directory. */
export function getWorkspaceRoot(): string | undefined {
    const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.path : undefined;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("Couldn't find the workspace root directory");
        return;
    }
    return workspaceRoot;
}

/** The path for reading files. */
export function fsPath(): string | undefined {
    const fsPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    if (!fsPath) {
        vscode.window.showErrorMessage("Couldn't find the file system path");
        return;
    }
    return fsPath;
}