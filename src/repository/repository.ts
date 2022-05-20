import {IRepository, IRepositoryCreate, IRepositoryEntity, IRepositoryFetchProps, IRepositoryFetchQuery, IRepositoryQuery, IRepositoryResponse, ISourceCount, ISourceEntity, ISourceFetch, ISourceFind, ISourceQuery} from "@leight-core/api";
import {GetServerSidePropsContext} from "next";

export interface IRepositoryRequest<TRepositoryService extends IRepository<any, any, any, any, any, any>> {
	readonly name: string;
	readonly query: ISourceQuery<IRepositoryQuery<TRepositoryService>, IRepositoryEntity<TRepositoryService>>;
	readonly fetch: ISourceFetch<IRepositoryQuery<TRepositoryService>, IRepositoryEntity<TRepositoryService>>;
	readonly find: ISourceFind<IRepositoryQuery<TRepositoryService>, IRepositoryEntity<TRepositoryService>>;
	readonly entity: ISourceEntity<IRepositoryEntity<TRepositoryService>>;
	readonly count: ISourceCount<IRepositoryQuery<TRepositoryService>>;

	create(create: IRepositoryCreate<TRepositoryService>): Promise<IRepositoryEntity<TRepositoryService>>;

	mapper(entity: IRepositoryEntity<TRepositoryService>): Promise<IRepositoryResponse<TRepositoryService>>;
}

export const Repository = <TRepository extends IRepository<any, any, any, any, any, any>>(
	{
		name,
		query,
		fetch,
		find,
		count,
		entity,
		mapper,
		create,
	}: IRepositoryRequest<TRepository>):
	Omit<IRepository<IRepositoryCreate<TRepository>, IRepositoryEntity<TRepository>, IRepositoryResponse<TRepository>, IRepositoryQuery<TRepository>, IRepositoryFetchProps<TRepository>, IRepositoryFetchQuery<TRepository>>,
		"fetch" | "create" | "query"> => {
	const handleQuery: TRepository["handleQuery"] = ({request}) => query(request);
	return {
		handleQuery,
		map: mapper,
		list: async entities => Promise.all((await entities).map(mapper)),
		toMap: async id => mapper(await entity(id)),
		handleCreate: async ({request}) => mapper(await create(request)),
		importers: () => ({
			[name]: () => ({handler: create}),
		}),
		pageFetch: (key, query) => async (ctx: GetServerSidePropsContext<any>): Promise<any> => {
			if (!ctx.params?.[query]) {
				return {
					notFound: true,
				};
			}
			const item = await entity(ctx.params[query] as string);
			if (!item) {
				return {
					notFound: true,
				};
			}
			return {
				props: {
					[key]: await mapper(item),
				}
			};
		},
	};
};
