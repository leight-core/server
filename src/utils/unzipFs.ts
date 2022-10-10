import {templateOf} from "@leight-core/utils";
// @ts-ignore
import zipper       from "zip-local";

export interface IZipFs {
	read(path: string, params?: Record<string, string>): string;

	json<T>(path: string, params?: Record<string, string>): T;
}

// noinspection TypeScriptValidateJSTypes
export const unzipFs = async <T>(zip: string, callback: (fs: IZipFs) => Promise<T>): Promise<T> => {
	const $zip = zipper.sync.unzip(zip);
	const fs   = $zip.memory();
	return callback({
		read(path: string, params: Record<string, string> = {}) {
			return fs.read(templateOf(path, params), "text");
		},
		json<T>(path: string, params: Record<string, string> = {}): T {
			return JSON.parse(fs.read(templateOf(path, params), "text")) as T;
		}
	});
};
