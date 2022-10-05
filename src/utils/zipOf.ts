// @ts-ignore
import zipper from "zip-local";

// noinspection TypeScriptValidateJSTypes
export const zipOf = (source: string, target: string) => zipper.sync.zip(source).compress().save(target);
