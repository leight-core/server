import {IQuery, IQueryFilter} from "@leight-core/api";

export interface IFindOfRequest<TQuery extends IQuery<any, any>> {
	where: IQueryFilter<TQuery>;
	rejectOnNotFound?: boolean;
}

export type IFindOfCallback<TQuery extends IQuery<any, any>, TEntity> = (findOf: IFindOfRequest<TQuery>) => Promise<TEntity>;

export const findOf = <TQuery extends IQuery<any, any>, TEntity>(findOfCallback: IFindOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity> => findOfCallback({
	where: query.filter,
	rejectOnNotFound: true,
});
