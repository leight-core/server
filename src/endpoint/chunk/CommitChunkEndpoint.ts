import {IChunkCommit, IChunkCommitEvent, IChunkService, IEndpoint, IFile} from "@leight-core/api";
import {IChunkEndpointQuery} from "@leight-core/server";

export const CommitChunkEndpoint: (chunkService: IChunkService, chunkCommitEvent: IChunkCommitEvent) => IEndpoint<"Commit", IChunkCommit, IFile, IChunkEndpointQuery> = (chunkService, chunkCommitEvent) => async params => {
	return chunkCommitEvent(chunkService.commit(params.query.chunkId, params.req.body), params);
}
