import fs     from "node:fs";
// @ts-ignore
import zipper from "zip-local";

// noinspection TypeScriptValidateJSTypes
export const unzipTo = (zip: string, target: string): void => {
	fs.mkdirSync(target, {recursive: true});
	zipper.sync.unzip(zip).save(target);
};
