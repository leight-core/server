import {IQuery, IQueryFilter} from "@leight-core/api";

export interface ICountOfRequest<TQuery extends IQuery<any, any>> {
	where?: IQueryFilter<TQuery>;
}

export interface ICountOfCallback<TQuery extends IQuery<any, any>> {
	count(countOf?: ICountOfRequest<TQuery>): Promise<number>;
}

export const countOf = <TQuery extends IQuery<any, any>>(countOfCallback: ICountOfCallback<TQuery>) => async (query: TQuery): Promise<number> => countOfCallback.count({
	where: query.filter,
});
