import {cleanup, generateImports} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateFetchEndpoint(sdk: ISdk): string {
	const name = sdk.endpoint.name.replace("Endpoint", "");
	const query = (sdk.endpoint.generics?.[1] || "IQueryParams");
	const response = (sdk.endpoint.generics?.[0] || "void");
	const api = sdk.endpoint.api;

	sdk.imports.push(...[
		{imports: ['FC'], from: '"react"'},
		{imports: ['AxiosRequestConfig'], from: '"axios"'},
		{imports: ['IQueryParams'], from: '"@leight-core/api"'},
		{
			imports: [
				'createQueryHook',
				'createPromiseHook',
				'useLinkContext',
			],
			from: '"@leight-core/client"'
		},
	]);

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${api}";

export type I${name}QueryParams = ${query};

export const use${name}Query = createQueryHook<void, ${response}, I${name}QueryParams>(${name}ApiLink, "get");

export const use${name}Link = (): ((query: I${name}QueryParams) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${name}ApiLink, query);
}

export const use${name}Promise = createPromiseHook<void, ${response}, I${name}QueryParams>(${name}ApiLink, "get");
`);
}
