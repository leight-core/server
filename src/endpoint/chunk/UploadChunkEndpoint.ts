import {
	IChunkService,
	IContainer,
	IEndpoint
}                            from "@leight-core/api";
import {IChunkEndpointQuery} from "@leight-core/server";

export interface IUploadChunkEndpointRequest {
	chunkService: IChunkService;
	acl?: string[];
	container: () => Promise<IContainer>;
}

export const UploadChunkEndpoint: (request: IUploadChunkEndpointRequest) => IEndpoint<"Upload", string, void, IChunkEndpointQuery> = ({chunkService, acl, container}) => ({
	container,
	handler: async ({res, query: {chunkId}, toBody}) => {
		await chunkService.chunk(chunkId, toBody());
		res.status(200).end();
	},
	acl,
});
