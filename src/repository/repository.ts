import {IMapperResult, IPrismaClientTransaction, IQuery, IQueryResult, IRepositoryService, ISource, ISourceMapper, IToQuery} from "@leight-core/api";

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
		query: {size, filter, orderBy},
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

export const AbstractRepositoryService = <TEntity, TResponse, TQuery extends IQuery<any, any>>(
	prismaClient: IPrismaClientTransaction,
	source: ISource<TEntity, TQuery>,
	mapper: (entity: TEntity) => Promise<TResponse>,
): Pick<IRepositoryService<any, TEntity, TResponse, TQuery>, "fetch" | "query" | "map" | "toMap"> => ({
	fetch: async id => (await source.findUnique({
		where: {id},
		rejectOnNotFound: true,
	})) as TEntity,
	query: async query => toQuery<(entities: Promise<TEntity[]>) => Promise<TResponse[]>, TQuery>({
		query,
		source,
		mapper: async entities => Promise.all((await entities).map(mapper)),
	}),
	map: mapper,
	async toMap(id) {
		return mapper(await this.fetch(id))
	},
});
