import {IImportHandlers} from "@leight-core/api";

export const toHandler = <TItem>(name: string, handler: () => (item: TItem) => Promise<any>): () => IImportHandlers => () => ({
	[name]: () => ({handler: handler()}),
})
