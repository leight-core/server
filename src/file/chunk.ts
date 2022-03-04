import {IChunkService, IChunkServiceConfig, IFile} from "@leight-core/api";
import {outputFileSync} from "fs-extra";

export const ChunkService: (config?: IChunkServiceConfig) => IChunkService = (config = {path: '.data/chunk/{chunkId}'}) => {
	return {
		async chunk(chunkId, chunk) {
			outputFileSync(config.path.replace('{chunkId}', chunkId.split('-').join('/')), await chunk, {flag: 'a'});
		},
		commit(chunkId, commit): IFile {
			return {} as any;
		}
	}
}
