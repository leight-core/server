import {IQuery, IQueryFilter, IQueryOrderBy} from "@leight-core/api";

export interface IManyOfRequest<TQuery extends IQuery<any, any>> {
	where?: IQueryFilter<TQuery>;
	orderBy?: IQueryOrderBy<TQuery>;
	take?: number;
	skip?: number;
}

export type IManyOfCallback<TQuery extends IQuery<any, any>, TEntity> = (manyOf?: IManyOfRequest<TQuery>) => Promise<TEntity[]>;

export const manyOf = <TQuery extends IQuery<any, any>, TEntity>(manyOfCallback: IManyOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity[]> => manyOfCallback({
	where: query.filter,
	take: query.size,
	skip: query.page && query.size && query.page * query.size,
});
