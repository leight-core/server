import {IQuery, IQueryFilter} from "@leight-core/api";

export interface ICountOfRequest<TQuery extends IQuery<any, any>> {
	where?: IQueryFilter<TQuery>;
}

export type ICountOfCallback<TQuery extends IQuery<any, any>> = (request?: ICountOfRequest<TQuery>) => Promise<number>;

export const countOf = <TQuery extends IQuery<any, any>>(callback: ICountOfCallback<TQuery>) => async (query: TQuery): Promise<number> => callback({
	where: query.filter,
});
