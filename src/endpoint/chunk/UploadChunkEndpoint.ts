import {IChunkServiceConfig, IEndpoint} from "@leight-core/api";
import {ChunkService, IChunkEndpointQuery} from "@leight-core/server";

export const UploadChunkEndpoint: (config?: IChunkServiceConfig) => IEndpoint<"Upload", string, void, IChunkEndpointQuery> = config => async ({res, query: {chunkId}, toBody}) => {
	await ChunkService(config).chunk(chunkId, toBody());
	res.status(200).end();
}
