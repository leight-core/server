import {IQuery, IQueryFilter} from "@leight-core/api";

export interface IFindOfRequest<TQuery extends IQuery<any, any>> {
	where: IQueryFilter<TQuery>;
	rejectOnNotFound?: boolean;
}

export interface IFindOfCallback<TQuery extends IQuery<any, any>, TEntity> {
	findFirst(findOf: IFindOfRequest<TQuery>): Promise<TEntity>;
}

export const findOf = <TQuery extends IQuery<any, any>, TEntity>(findOfCallback: IFindOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity> => findOfCallback.findFirst({
	where: query.filter,
	rejectOnNotFound: true,
});
