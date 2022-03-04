import {IChunkCommit, IChunkServiceConfig, IEndpoint, IFile} from "@leight-core/api";
import {ChunkService} from "@leight-core/server";

export const CommitChunkEndpoint: (config?: IChunkServiceConfig) => IEndpoint<"Commit", IChunkCommit, IFile, { chunkId: string }> = config => async ({req, res}) => {
	ChunkService(config).commit(req.query.chunkId, req.body);
	res.status(200).end('ok');
}
