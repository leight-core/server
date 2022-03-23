import {IMapperResult, IPrismaClientTransaction, IQuery, IQueryResult, IRepositoryEntity, IRepositoryQuery, IRepositoryResponse, IRepositoryService, ISource, ISourceMapper, IToQuery} from "@leight-core/api";
import {IQueryFilter} from "@leight-core/api/lib/cjs/source/interface";
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

export const AbstractRepositoryService = <TRepositoryService extends IRepositoryService<any, any, any, any, any, any>>(
	prismaClient: IPrismaClientTransaction,
	source: ISource<IRepositoryEntity<TRepositoryService>, IRepositoryQuery<TRepositoryService>>,
	mapper: (entity: IRepositoryEntity<TRepositoryService>) => Promise<IRepositoryResponse<TRepositoryService>>,
	toFilter?: (filter?: IQueryFilter<IRepositoryQuery<TRepositoryService>>) => IQueryFilter<IRepositoryQuery<TRepositoryService>> | undefined,
): Pick<TRepositoryService, "fetch" | "query" | "handleQuery" | "map" | "toMap" | 'list' | 'pageFetch' | "importers"> => ({
	fetch: async id => (await source.findUnique({
		where: {id},
		rejectOnNotFound: true,
	})) as IRepositoryEntity<TRepositoryService>,
	async query(query) {
		return toQuery<(entities: Promise<IRepositoryEntity<TRepositoryService>[]>) => Promise<IRepositoryResponse<TRepositoryService>[]>, IRepositoryQuery<TRepositoryService>>({
			query,
			source,
			mapper: this.list,
			toFilter,
		})
	},
	async handleQuery({request}) {
		return this.query(request);
	},
	map: mapper,
	list: async entities => Promise.all((await entities).map(mapper)),
	async toMap(id) {
		return mapper(await this.fetch(id))
	},
	importers: () => ({}),
	pageFetch(key, query) {
		return async (ctx: GetServerSidePropsContext<any>): Promise<any> => {
			if (!ctx.params?.[query]) {
				return {
					notFound: true,
				}
			}
			const item = await this.fetch(ctx.params[query] as string);
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
		}
	},
});
