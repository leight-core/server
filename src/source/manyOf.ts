import {IQuery, IQueryFilter, IQueryOrderBy} from "@leight-core/api";
import {pageOf} from "./pageOf";

export interface IManyOfRequest<TQuery extends IQuery<any, any>> {
	where?: IQueryFilter<TQuery>;
	orderBy?: IQueryOrderBy<TQuery>;
	take?: number;
	skip?: number;
}

export type IManyOfCallback<TQuery extends IQuery<any, any>, TEntity> = (request?: IManyOfRequest<TQuery>) => Promise<TEntity[]>;

export const manyOf = <TQuery extends IQuery<any, any>, TEntity>(callback: IManyOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity[]> => callback({
	where: query.filter,
	...pageOf(query),
});
