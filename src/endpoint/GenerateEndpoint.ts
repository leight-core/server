import {
	IContainer,
	IEndpoint,
	IGenerators
}                       from "@leight-core/api";
import {generateSdkFor} from "@leight-core/server";

export interface IGenerateEndpointRequest {
	path?: string | undefined;
	generators?: IGenerators | undefined;
	acl?: string[];
	container: () => Promise<IContainer>;
}

export const GenerateEndpoint: (request: IGenerateEndpointRequest) => IEndpoint<"Generate", void, string[]> = ({path = "src/pages/api/**/*.ts", generators, acl, container}) => ({
	container,
	handler: async () => {
		return generateSdkFor(path, generators);
	},
	acl,
});
