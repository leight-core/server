import {IQuery, IRepository, ISource} from "@leight-core/api";

export interface IRepositoryRequest<TCreate, TEntity, TItem, TQuery extends IQuery<any, any>> {
	source: ISource<TEntity, TItem, TQuery>;
	create: IRepository<TCreate, TEntity, TItem, TQuery>["create"];
	delete?: IRepository<TCreate, TEntity, TItem, TQuery>["delete"];
}

export const Repository = <TCreate, TEntity, TItem, TQuery extends IQuery<any, any>>(request: IRepositoryRequest<TCreate, TEntity, TItem, TQuery>): IRepository<TCreate, TEntity, TItem, TQuery> => {
	return {
		source: request.source,
		create: request.create,
		delete: ids => {
			if (!request.delete) {
				throw new Error(`Delete is not supported on [${request.source.name}] repository.`);
			}
			return request.delete(ids);
		},
	};
};
