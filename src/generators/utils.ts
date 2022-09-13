import {ISdk} from "@leight-core/api";

export interface IGeneratorCommons {
	name: string;
	api: string;
	generics: string[];
}

export const toGeneratorCommons = (sdk: ISdk): IGeneratorCommons => {
	const name = sdk.endpoint.name.replace("Endpoint", "");
	const generics = sdk.endpoint.generics;
	sdk.endpoint.generics.length === 3 && sdk.endpoint.generics.pop();
	return {
		name,
		api: sdk.endpoint.api,
		generics,
	};
};

export const cleanup = (code: string): string => {
	return code.replace(/\n\s*\n\s*\n/g, "\n\n").trim() + "\n";
};
