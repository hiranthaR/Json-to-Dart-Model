import * as path from 'path';
import { window } from 'vscode';
import { fm } from '../utils';

/**
 * Run dart format command to format dart code with formatting that follows Dart guidelines.
 * @param {string} text the destination directory to be formatted.
 * 
 * To format directory test
 * @example
 * ```bash
 * lib test
 * ```
 */
export const runDartFormat = (directory: string, lastDirectory: string) => {
    if (!fm.workspaceRoot) { return; }

    const root = fm.workspaceRoot;
    const dir = directory.startsWith(root) ?
        directory.replace(root, '') :
        directory;
    const names = path.join(dir, lastDirectory.toLowerCase()).split(path.sep);
    const fileDirectory = names.join(' ');
    const dartFormat = `dart format${fileDirectory}`;
    const terminal = window.createTerminal({ name: 'dart format bin', hideFromUser: true });

    terminal.sendText(dartFormat);
    console.debug(dartFormat);
};

/**
 * Run "build_runner build".
 */
export const runBuildRunner = () => {
    const terminal = window.createTerminal({ name: 'pub get', hideFromUser: false });

    terminal.sendText(
        'flutter pub run build_runner build --delete-conflicting-outputs'
    );

    terminal.show(true);
};