import {ISdk} from "@leight-core/api";

export interface IGeneratorCommons {
	name: string;
	request: string;
	response: string;
	pair: string;
	api: string;
	query: string;
	generics: string;
}

export const toGeneratorCommons = (sdk: ISdk): IGeneratorCommons => {
	const name = sdk.endpoint.name.replace("Endpoint", "");
	const request = (sdk.endpoint.generics?.[0] || "void");
	const response = (sdk.endpoint.generics?.[1] || "void");
	const pair = `${request}, ${response}`;
	return {
		name,
		pair,
		request,
		response,
		api: sdk.endpoint.api,
		query: sdk.endpoint.generics?.[2] || "IQueryParams",
		generics: `${pair}, I${name}QueryParams`,
	}
}

export const cleanup = (code: string): string => {
	return code.replace(/\n\s*\n\s*\n/g, '\n\n').trim() + "\n";
}
