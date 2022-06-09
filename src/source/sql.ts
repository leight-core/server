import {PrismaClient} from "@prisma/client";
import fs from "fs";

export const sqlParse = (source: string): string[] => {
	return source
		.replace(/(--)(.*)/g, "")
		.replace(/\r?\n|\r/g, " ")
		.replace(/\/\*.*\*\//g, " ")
		.replace(/\s\s+/g, " ")
		.split(";")
		.map(query => query.trim())
		.filter(query => query.length);
};

export const sqlRead = (file: string): string[] => sqlParse(fs.readFileSync(file).toString());

export const sqlExecute = async <T>(file: string, executor: (query: string) => Promise<T>): Promise<T[]> => {
	const queries = sqlRead(file);
	const results: T[] = [];
	for (const query of queries) {
		results.push(await executor(query));
	}
	return results;
};

export const runSql = (source: string, prisma: PrismaClient, timeout: number = 1000 * 60) => {
	return prisma.$transaction(async prisma => sqlExecute(source, sql => {
		console.log(`Executing: ${sql}`);
		return prisma.$executeRawUnsafe(sql);
	}), {
		timeout,
	});
};
