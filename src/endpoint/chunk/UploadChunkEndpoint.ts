import {IChunkServiceDeps, IEndpoint} from "@leight-core/api";
import {ChunkService, IChunkEndpointQuery} from "@leight-core/server";

export const UploadChunkEndpoint: (deps: IChunkServiceDeps) => IEndpoint<"Upload", string, void, IChunkEndpointQuery> = deps => async ({res, query: {chunkId}, toBody}) => {
	await ChunkService(deps).chunk(chunkId, toBody());
	res.status(200).end();
}
