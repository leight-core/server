import {IQuery, IQueryFilter} from "@leight-core/api";

export interface IFindOfRequest<TQuery extends IQuery<any, any>> {
	where: IQueryFilter<TQuery>;
	rejectOnNotFound?: boolean;
}

export type IFindOfCallback<TQuery extends IQuery<any, any>, TEntity> = (request: IFindOfRequest<TQuery>) => Promise<TEntity | null>;

export const findOf = <TQuery extends IQuery<any, any>, TEntity>(callback: IFindOfCallback<TQuery, TEntity>) => async (query: TQuery): Promise<TEntity> => await callback({
	where: query.filter,
	rejectOnNotFound: true,
}) as TEntity;
