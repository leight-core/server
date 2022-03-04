import {IImportReflection} from "@leight-core/api";

export const generateImports = (imports: IImportReflection[]): string => {
	return imports.map(_import => `import {${_import.imports.join(", ")}} from ${_import.from};`).join("\n");
}
