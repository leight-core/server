import {IFile, IFileServiceFactory} from "@leight-core/api";
import {copySync} from "fs-extra";
import mime from "mime-types";
import fs from "node:fs";
import {v4} from "uuid";

export const FileService: IFileServiceFactory = ({config = {path: ".data/file/{fileId}"}}) => {
	const toLocation = (fileId: string) => config.path.replace("{fileId}", fileId.split("-").join("/"));
	const mimeOf = (file: string) => mime.lookup(file) || config?.defaultMimeType || "application/octet-stream";
	const sizeOf = (file: string) => fs.statSync(file).size;

	return {
		mimeOf,
		sizeOf,
		toLocation,
		store: store => {
			const id = v4();
			const location = toLocation(id);
			const file: IFile = {
				id,
				path: store.path,
				name: store.name,
				location,
				mime: mimeOf(store.file),
				size: sizeOf(store.file),
				created: (new Date()).toISOString(),
				ttl: undefined,
			};
			copySync(store.file, location, {overwrite: store.replace});
			return file;
		}
	};
};
