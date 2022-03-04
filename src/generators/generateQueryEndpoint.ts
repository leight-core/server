import {cleanup, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateQueryEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	// language=text
	return cleanup(`
import {FC} from "react";
import {IQueryParams, ISourceContext} from "@leight-core/api";	
import {Form, IFormProps, useSourceContext, ISourceProviderProps, createQueryHook, createPromiseHook, useLinkContext} from "@leight-core/client";	
import {AxiosRequestConfig} from "axios";
${sdk.imports.map(_import => `import {${_import.imports.join(", ")}} from ${_import.from};`).join("\n")}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${generatorCommons.name}ApiLink = "${generatorCommons.api}";

export type I${generatorCommons.name}QueryParams = ${generatorCommons.query};

export const use${generatorCommons.name}Query = createQueryHook<${generatorCommons.generics}>(${generatorCommons.name}ApiLink, "post");

export const use${generatorCommons.name}Source = () => useSourceContext<${generatorCommons.response}, I${generatorCommons.name}QueryParams>()

export interface I${generatorCommons.name}SourceContext extends ISourceContext<${generatorCommons.response}, I${generatorCommons.name}QueryParams> {
}

export interface I${generatorCommons.name}SourceProps extends Partial<ISourceProviderProps<${generatorCommons.response}, I${generatorCommons.name}QueryParams>> {
}

export const use${generatorCommons.name}Link = (): ((query: I${generatorCommons.name}QueryParams) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${generatorCommons.name}ApiLink, query);
}

export const use${generatorCommons.name}Promise = createPromiseHook<${generatorCommons.generics}>(${generatorCommons.name}ApiLink, "post");
`);
}
