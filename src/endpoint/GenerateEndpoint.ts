import {generateSdkFor} from "@leight-core/server";
import {IEndpoint, IGenerators} from "@leight-core/api";

export const GenerateEndpoint: (path?: string | undefined, generators?: IGenerators | undefined) => IEndpoint<"Generate", void, string[]> = (path = 'src/pages/api/**/*.ts', generators) => async () => {
	return generateSdkFor(path, generators);
};
