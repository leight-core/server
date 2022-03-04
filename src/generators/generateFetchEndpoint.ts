import {cleanup} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateFetchEndpoint(sdk: ISdk): string {
	const name = sdk.endpoint.name.replace("Endpoint", "");
	const query = (sdk.endpoint.generics?.[1] || "void");
	const response = (sdk.endpoint.generics?.[0] || "void");
	const api = sdk.endpoint.api;

	// language=text
	return cleanup(`
import {FC} from "react";
import {createQueryHook, createPromiseHook, useLinkContext} from "@leight-core/client";
import {AxiosRequestConfig} from "axios";
${sdk.imports.map(_import => `import {${_import.imports.join(", ")}} from ${_import.from};`).join("\n")}

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
