import {generateSdkFor} from "@leight-core/server";
import {IEndpoint, IGenerators} from "@leight-core/api";

export const GenerateEndpoint: (path?: string | undefined, generators?: IGenerators | undefined) => IEndpoint<"Generate", void, string[]> = (path = 'src/pages/api/**/*.ts', generators: IGenerators | undefined = undefined) => async ({res}) => {
	res.status(200).json(await generateSdkFor(path, generators));
};
