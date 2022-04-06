import {IEndpoint, IGenerators} from "@leight-core/api";
import {generateSdkFor} from "@leight-core/server";

export const GenerateEndpoint: (path?: string | undefined, generators?: IGenerators | undefined) => IEndpoint<"Generate", void, string[]> = (path = "src/pages/api/**/*.ts", generators) => async () => {
	return generateSdkFor(path, generators);
};
