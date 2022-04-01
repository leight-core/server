import {
	IMapperResult,
	IQuery,
	IQueryFilter,
	IQueryResult,
	IRepositoryCreate,
	IRepositoryEntity,
	IRepositoryFetchProps,
	IRepositoryFetchQuery,
	IRepositoryQuery,
	IRepositoryResponse,
	IRepositoryService,
	ISource,
	ISourceMapper,
	IToQuery
} from "@leight-core/api";
import {GetServerSidePropsContext} from "next";

export async function toResult<TResult>(size: number | undefined, total: Promise<number>, items: Promise<TResult[]>): Promise<IQueryResult<TResult>> {
	const _items = await items;
	const _total = await total;
	return {
		count: _items.length,
		size,
		total: _total,
		pages: size && Math.ceil(_total / Math.max(size, 1)),
		items: _items,
	}
}

export const toQuery = <TMapper extends ISourceMapper<any, any>, TQuery extends IQuery<any, any>>(
	{
		query: {page, size, filter, orderBy},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		toFilter = ({fulltext, ...filter}: any) => filter,
		source,
		mapper,
	}: IToQuery<TMapper, TQuery>) => {
	const where = filter && toFilter?.(filter);
	return toResult<IMapperResult<TMapper>>(
		size,
		source.count({where}),
		mapper(source.findMany({
			where,
			orderBy,
			take: size,
			skip: page && size && size * page,
		}))
	)
}

export const toFulltext = <TFilter>(search: string | undefined, fields: (keyof TFilter)[]): Partial<TFilter> | undefined => {
	return search ? {
		OR: fields.map(field => ({
			[field]: {
				contains: search,
				mode: 'insensitive',
			}
		}))
	} as any : undefined;
}

export interface IRepositoryServiceRequest<TRepositoryService extends IRepositoryService<any, any, any, any, any, any>> {
	name: string,
	create: (create: IRepositoryCreate<TRepositoryService>) => Promise<IRepositoryEntity<TRepositoryService>>,
	source: ISource<IRepositoryEntity<TRepositoryService>, IRepositoryQuery<TRepositoryService>>,
	mapper: (entity: IRepositoryEntity<TRepositoryService>) => Promise<IRepositoryResponse<TRepositoryService>>,
	toFilter?: (filter?: IQueryFilter<IRepositoryQuery<TRepositoryService>>) => IQueryFilter<IRepositoryQuery<TRepositoryService>> | undefined,
}

export const RepositoryService = <TRepositoryService extends IRepositoryService<any, any, any, any, any, any>>(
	{
		name,
		source,
		mapper,
		create,
		toFilter,
	}: IRepositoryServiceRequest<TRepositoryService>): IRepositoryService<IRepositoryCreate<TRepositoryService>, IRepositoryEntity<TRepositoryService>, IRepositoryResponse<TRepositoryService>, IRepositoryQuery<TRepositoryService>, IRepositoryFetchProps<TRepositoryService>, IRepositoryFetchQuery<TRepositoryService>> => {
	const list: TRepositoryService['list'] = async entities => Promise.all((await entities).map(mapper));
	const query: TRepositoryService['query'] = query => toQuery<(entities: Promise<IRepositoryEntity<TRepositoryService>[]>) => Promise<IRepositoryResponse<TRepositoryService>[]>, IRepositoryQuery<TRepositoryService>>({
		query,
		source,
		mapper: list,
		toFilter,
	});
	const fetch: TRepositoryService['fetch'] = async id => (await source.findUnique({
		where: {id},
		rejectOnNotFound: true,
	})) as IRepositoryEntity<TRepositoryService>;
	const toMap: TRepositoryService['toMap'] = async id => mapper(await fetch(id));
	const handleQuery: TRepositoryService['handleQuery'] = ({request}) => query(request);

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
				}
			}
			const item = await fetch(ctx.params[query] as string);
			if (!item) {
				return {
					notFound: true,
				}
			}
			return {
				props: {
					[key]: await mapper(item),
				}
			};
		},
	};
};

export const handleUniqueException = async <T>(e: any, callback: () => Promise<T>): Promise<T> => {
	if ((e as Error).message?.includes('Unique constraint failed on the fields')) {
		return callback();
	}
	throw e;
}
