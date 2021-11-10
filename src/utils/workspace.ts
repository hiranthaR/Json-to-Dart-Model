import * as vscode from 'vscode';

/** The path for reading directory. */
export function getWorkspaceRoot(): string | undefined {
    const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.path : undefined;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage("Couldn't find the workspace folder. Open the folder and try again");
        return;
    }
    
    return workspaceRoot;
}

/** The path for reading files. */
export function workspaceFolders(): readonly vscode.WorkspaceFolder[] {
    const folders =  vscode.workspace.workspaceFolders;

    if (!folders) {
        vscode.window.showErrorMessage("Couldn't find the workspace folder. Open the folder and try again");
        return [];
    }

    return folders;
}