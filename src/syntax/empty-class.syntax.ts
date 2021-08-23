import { printLine } from '../syntax';

export function emptyClass(className: string): string {
    let sb = '';
    sb += printLine(`class ${className} {`, 1);
    sb += printLine(`${className}();`, 1, 1);
    sb += printLine(`factory ${className}.fromJson(Map<String, dynamic> json) {`, 2, 1);
    sb += printLine('// TODO: implement fromJson', 1, 2);
    sb += printLine(`throw UnimplementedError('${className}.fromJson($json) is not implemented');`, 1, 2);
    sb += printLine('}', 1, 1);
    sb += printLine('Map<String, dynamic> toJson() {', 2, 1);
    sb += printLine('// TODO: implement toJson', 1, 2);
    sb += printLine('throw UnimplementedError();', 1, 2);
    sb += printLine('}', 1, 1);
    sb += printLine('}', 1);
    return sb;
}