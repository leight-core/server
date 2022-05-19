import {IQueryFilter, IRepository, IRepositoryCreate, IRepositoryEntity, IRepositoryFetchProps, IRepositoryFetchQuery, IRepositoryQuery, IRepositoryResponse, ISource} from "@leight-core/api";
import {toQuery} from "@leight-core/server";
import {GetServerSidePropsContext} from "next";

export interface IRepositoryRequest<TRepositoryService extends IRepository<any, any, any, any, any, any>> {
	name: string;

	source: ISource<IRepositoryEntity<TRepositoryService>, IRepositoryQuery<TRepositoryService>>;

	create(create: IRepositoryCreate<TRepositoryService>): Promise<IRepositoryEntity<TRepositoryService>>;

	mapper(entity: IRepositoryEntity<TRepositoryService>): Promise<IRepositoryResponse<TRepositoryService>>;

	toFilter?(filter?: IQueryFilter<IRepositoryQuery<TRepositoryService>>): IQueryFilter<IRepositoryQuery<TRepositoryService>> | undefined;
}

export const Repository = <TRepository extends IRepository<any, any, any, any, any, any>>(
	{
		name,
		source,
		mapper,
		create,
		toFilter,
	}: IRepositoryRequest<TRepository>): IRepository<IRepositoryCreate<TRepository>, IRepositoryEntity<TRepository>, IRepositoryResponse<TRepository>, IRepositoryQuery<TRepository>, IRepositoryFetchProps<TRepository>, IRepositoryFetchQuery<TRepository>> => {
	const list: TRepository["list"] = async entities => Promise.all((await entities).map(mapper));
	const query: TRepository["query"] = query => toQuery<(entities: Promise<IRepositoryEntity<TRepository>[]>) => Promise<IRepositoryResponse<TRepository>[]>, IRepositoryQuery<TRepository>>({
		query,
		source,
		mapper: list,
		toFilter,
	});
	const fetch: TRepository["fetch"] = async id => (await source.findUnique({
		where: {id},
		rejectOnNotFound: true,
	})) as IRepositoryEntity<TRepository>;
	const toMap: TRepository["toMap"] = async id => mapper(await fetch(id));
	const handleQuery: TRepository["handleQuery"] = ({request}) => query(request);

	return {
		fetch,
		query,
		handleQuery,
		map: mapper,
		list,
		toMap,
		create,
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
			const item = await fetch(ctx.params[query] as string);
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
		toFilter: toFilter || (filter => filter),
	};
};
