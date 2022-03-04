import {IChunkCommit, IChunkServiceConfig, IEndpoint, IFile} from "@leight-core/api";
import {ChunkService} from "@leight-core/server";

export const CommitChunkEndpoint: (config?: IChunkServiceConfig) => IEndpoint<"Commit", IChunkCommit, IFile, { chunkId: string }> = config => async ({req, query: {chunkId}, res}) => {
	ChunkService(config).commit(chunkId, req.body);
	res.status(200).end('ok');
}
