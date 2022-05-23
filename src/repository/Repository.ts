import {IQuery, IRepository, ISource} from "@leight-core/api";

export interface IRepositoryRequest<TCreate, TSource extends ISource<any, any, IQuery<any, any>>> {
	source: TSource;
	create: IRepository<TCreate, TSource>["create"];
	delete?: IRepository<TCreate, TSource>["delete"];
}

export const Repository = <TCreate, TSource extends ISource<any, any, IQuery<any, any>>>(request: IRepositoryRequest<TCreate, TSource>): IRepository<TCreate, TSource> => {
	const repository: IRepository<TCreate, TSource> = {
		source: request.source,
		create: request.create,
		delete: ids => {
			if (!request.delete) {
				throw new Error(`Delete is not supported on [${request.source.name}] repository.`);
			}
			return request.delete(ids);
		},
		withUserId: id => {
			repository.source.withUserId(id);
			return repository;
		}
	};

	return repository;
};
