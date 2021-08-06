import { ConfigurationTarget, workspace, WorkspaceConfiguration } from "vscode";
import { CodeGenerator, Equality, StringMethod } from "./input";

class Configuration {
    private config: WorkspaceConfiguration;

    constructor() {
        workspace.onDidChangeConfiguration((e) => this.reloadConfig());
        this.config = workspace.getConfiguration("jsonToDart");
    }

    private reloadConfig() {
        this.config = workspace.getConfiguration("jsonToDart");
    }

    private getConfig<T>(key: string, defaultValue: T) {
        return this.config.get<T>(key, defaultValue);
    }

    async setConfig<T>(key: string, value: T, target: ConfigurationTarget): Promise<void> {
        await this.config.update(key, value, target);
    }

    get codeGenerator() { return CodeGenerator[this.getConfig<string>('codeGenerator', CodeGenerator.JSON) as CodeGenerator]; }
    get immutable() { return this.getConfig<boolean>('immutable', false); }
    get equality() { return Equality[this.getConfig<string>('equality', Equality.Default) as Equality]; };
    get toString() { return StringMethod[this.getConfig<string>('toString', StringMethod.Default) as StringMethod]; }
    get copyWith() { return this.getConfig<boolean>('copyWith', false); }
    get fastMode() { return this.getConfig<boolean>('fastMode', false); }
    get nullSafety() { return this.getConfig<boolean>('nullSafety', true); }
    get runBuilder() { return this.getConfig<boolean>('runBuilder', true); }
    get primaryConfiguration() { return this.getConfig<boolean>('primaryConfiguration', false); }
    get targetDirectory() { return this.getConfig<string>('targetDirectory.path', '/lib/models'); }
}

export const config = new Configuration();