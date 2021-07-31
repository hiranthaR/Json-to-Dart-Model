import * as vscode from 'vscode';

import { CodeGenerator, Equality, Input, StringMethod } from "../input";

export function getConfiguration(): Input {
    const config = vscode.workspace.getConfiguration('jsonToDart');
    let input = new Input();
    let codeGenId = config.get<string>('codeGenerator') as CodeGenerator ?? CodeGenerator.JSON;
    input.codeGenerator = CodeGenerator[codeGenId];
    input.immutable = config.get<boolean>('immutable') ?? false;
    let equalityId = config.get<string>('equality') as Equality ?? Equality.Default;
    input.equality = Equality[equalityId];
    let toStringId = config.get<string>('toString') as StringMethod ?? StringMethod.Default;
    input.toString = StringMethod[toStringId];
    input.copyWith = config.get<boolean>('copyWith') ?? false;
    input.fastMode = config.get<boolean>('fastMode') ?? false;
    input.nullSafety = config.get<boolean>('nullSafety') ?? true;
    input.runBuilder = config.get<boolean>('runBuilder') ?? true;
    input.primaryConfiguration = config.get<boolean>('primaryConfiguration') ?? false;
    input.targetDirectory = config.get<string>('targetDirectory.path') ?? "/lib/models";
    return input;
}