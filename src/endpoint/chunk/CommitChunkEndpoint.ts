import {IChunkCommit, IChunkServiceDeps, IEndpoint, IFile} from "@leight-core/api";
import {ChunkService, IChunkEndpointQuery} from "@leight-core/server";

export const CommitChunkEndpoint: (deps: IChunkServiceDeps) => IEndpoint<"Commit", IChunkCommit, IFile, IChunkEndpointQuery> = deps => async ({req: {body}, query: {chunkId}}) => {
	return ChunkService(deps).commit(chunkId, body);
}
