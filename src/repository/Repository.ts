import {IQuery, IRepository, IRepositoryCreate, IRepositorySource, ISource} from "@leight-core/api";

export interface IRepositoryRequest<TCreate, TSource extends ISource<any, any, IQuery<any, any>>> {
	source: TSource;
	create: IRepository<TCreate, TSource>["create"];
	delete?: IRepository<TCreate, TSource>["delete"];
}

export const Repository = <T extends IRepository<any, ISource<any, any, IQuery<any, any>>>>(
	{
		source,
		create,
		delete: $delete,
		...request
	}: IRepositoryRequest<IRepositoryCreate<T>, IRepositorySource<T>> & Omit<T, keyof IRepository<IRepositoryCreate<T>, IRepositorySource<T>>>): T => {
	const repository: IRepository<IRepositoryCreate<T>, IRepositorySource<T>> = {
		source,
		create,
		delete: ids => {
			if (!$delete) {
				throw new Error(`Delete is not supported on [${source.name}] repository.`);
			}
			return $delete(ids);
		},
		withUserId: id => {
			repository.source.withUserId(id);
			return repository;
		},
		...request,
	};

	return repository as IRepository<IRepositoryCreate<T>, IRepositorySource<T>> & T;
};
