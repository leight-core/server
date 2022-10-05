import {
	IChunkCommit,
	IChunkCommitEvent,
	IChunkService,
	IEndpoint,
	IFile
}                            from "@leight-core/api";
import {IChunkEndpointQuery} from "@leight-core/server";

export interface ICommitChunkEndpointRequest {
	chunkService: IChunkService;
	chunkCommitEvent: IChunkCommitEvent;
	acl?: string[];
}

export const CommitChunkEndpoint: (request: ICommitChunkEndpointRequest) => IEndpoint<"Commit", IChunkCommit, IFile, IChunkEndpointQuery> = ({chunkService, chunkCommitEvent, acl}) => ({
	handler: async params => {
		return chunkCommitEvent(chunkService.commit(params.query.chunkId, params.req.body), params);
	},
	acl,
});
