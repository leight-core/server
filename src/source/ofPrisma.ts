import {IQuery, ISource} from "@leight-core/api";
import {IManyOfCallback, manyOf} from "@leight-core/server";
import {countOf, ICountOfCallback} from "./countOf";
import {findOf, IFindOfCallback} from "./findOf";
import {getOf, IGetOfCallback} from "./getOf";

export interface IOfPrismaRequest<TQuery extends IQuery<any, any>, TEntity> {
	count: ICountOfCallback<TQuery>;
	findMany: IManyOfCallback<TQuery, TEntity>;
	findUnique: IGetOfCallback<TEntity>;
	findFirst: IFindOfCallback<TQuery, TEntity>;
}

export const ofPrisma = <TQuery extends IQuery<any, any>, TEntity>({count, findMany, findUnique, findFirst}: IOfPrismaRequest<TQuery, TEntity>): Pick<ISource<any, TEntity, any, TQuery>, "count" | "query" | "get" | "find"> => ({
	count: countOf(count),
	query: manyOf(findMany),
	get: getOf(findUnique),
	find: findOf(findFirst),
});
