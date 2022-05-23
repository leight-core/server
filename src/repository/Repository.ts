import {IQuery, IRepository, ISource} from "@leight-core/api";

export interface IRepositoryRequest<TCreate, TSource extends ISource<any, any, IQuery<any, any>>> {
	source: TSource;
	create: IRepository<TCreate, TSource>["create"];
	delete?: IRepository<TCreate, TSource>["delete"];
}

export const Repository = <TCreate, TSource extends ISource<any, any, IQuery<any, any>>, T extends IRepositoryRequest<TCreate, TSource>>(
	{
		source,
		create,
		delete: $delete,
		...request
	}: T): IRepository<TCreate, TSource> & Omit<T, keyof IRepositoryRequest<TCreate, TSource>> => {
	const repository: IRepository<TCreate, TSource> = {
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

	return repository as IRepository<TCreate, TSource> & Exclude<T, keyof IRepositoryRequest<TCreate, TSource>>;
};
