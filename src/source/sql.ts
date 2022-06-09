import {Sql} from "@leight-core/utils";
import {PrismaClient} from "@prisma/client";

export const runSql = (source: string, prisma: PrismaClient, timeout: number = 1000 * 60) => {
	return prisma.$transaction(async prisma => Sql.execute(source, prisma.$executeRawUnsafe), {
		timeout,
	});
};
