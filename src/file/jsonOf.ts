import {templateOf} from "@leight-core/utils";
import fs           from "node:fs";

export const jsonOf = <T>(file: string, params: Record<string, string> = {}): T => {
	return JSON.parse(fs.readFileSync(templateOf(file, params), "utf8")) as T;
};
