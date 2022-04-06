import {IChunkService, IEndpoint} from "@leight-core/api";
import {IChunkEndpointQuery} from "@leight-core/server";

export const UploadChunkEndpoint: (chunkService: IChunkService) => IEndpoint<"Upload", string, void, IChunkEndpointQuery> = chunkService => async ({res, query: {chunkId}, toBody}) => {
	await chunkService.chunk(chunkId, toBody());
	res.status(200).end();
};
