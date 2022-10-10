import {templateOf} from "@leight-core/utils";
// @ts-ignore
import zipper       from "zip-local";

export interface IZipFs {
	read(path: string, params?: Record<string, string>): string;

	json<T>(path: string, params?: Record<string, string>): T;
}

// noinspection TypeScriptValidateJSTypes
export const unzipFs = async <T>(zip: string, callback: (fs: IZipFs) => Promise<T>): Promise<T> => {
	const fs = zipper.sync.unzip(zip).memory();
	return callback({
		read: (path: string, params: Record<string, string> = {}) => fs.read(templateOf(path, params), "text"),
		json: <T>(path: string, params: Record<string, string> = {}): T => JSON.parse(fs.read(templateOf(path, params), "text")) as T,
	});
};
