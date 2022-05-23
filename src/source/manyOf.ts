import {IQuery, IQueryFilter} from "@leight-core/api";

export interface IManyOfRequest<TQuery extends IQuery<any, any>> {
	where: IQueryFilter<TQuery>;
	take?: number;
	skip?: number;
}

export interface IManyOfCallback<TQuery extends IQuery<any, any>, TEntity> {
	findMany(manyOf: IManyOfRequest<TQuery>): Promise<TEntity[]>;
}

export const manyOf = <TQuery extends IQuery<any, any>, TEntity>(manyOfCallback: IManyOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity[]> => manyOfCallback.findMany({
	where: query.filter,
	take: query.size,
	skip: query.page && query.size && query.page * query.size,
});
