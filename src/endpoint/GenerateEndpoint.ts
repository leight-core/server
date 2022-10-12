import {
	IContainer,
	IEndpointHandler,
	IGenerators
}                       from "@leight-core/api";
import {generateSdkFor} from "@leight-core/server";

export interface IGenerateEndpointRequest<TContainer extends IContainer> {
	path?: string | undefined;
	generators?: IGenerators | undefined;
	acl?: string[];
	container: () => Promise<TContainer>;
}

export const GenerateEndpoint: <TContainer extends IContainer>(request: IGenerateEndpointRequest<TContainer>) => IEndpointHandler<TContainer, void, string[]> = (
	{
		path = "src/pages/api/**/*.ts",
		generators,
		acl,
		container,
	}) => ({
	name:    "Generate",
	container,
	acl,
	handler: async () => generateSdkFor(path, generators),
});
