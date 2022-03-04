import {IChunkCommit, IChunkService, IEndpoint, IFile} from "@leight-core/api";
import {IChunkEndpointQuery} from "@leight-core/server";

export const CommitChunkEndpoint: (chunkService: IChunkService) => IEndpoint<"Commit", IChunkCommit, IFile, IChunkEndpointQuery> = chunkService => async ({req: {body}, query: {chunkId}}) => {
	return chunkService.commit(chunkId, body);
}
