import fs  from "node:fs";
import tar from "tar";

export const unpack = (archive: string, target: string) => {
	fs.mkdirSync(target, {recursive: true});
	return tar.x({
		strip: 1,
		file:  archive,
		cwd:   target,
	});
};
