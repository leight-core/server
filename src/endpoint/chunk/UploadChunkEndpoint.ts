import {IChunkServiceConfig, IEndpoint} from "@leight-core/api";
import {ChunkService} from "@leight-core/server";

export const UploadChunkEndpoint: (config?: IChunkServiceConfig) => IEndpoint<"Upload", string, void, { chunkId: string }> = config => async ({req, res, toBody}) => {
	await ChunkService(config).chunk(req.query.chunkId, toBody());
	res.status(200).end('ok');
}
