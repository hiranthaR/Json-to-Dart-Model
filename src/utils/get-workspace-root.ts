import * as vscode from 'vscode';

export function getWorkspaceRoot(): string | undefined {
    const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("Couldn't find the workspace root directory");
        return;
    }
    return workspaceRoot;
}