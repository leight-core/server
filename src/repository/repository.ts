import {IMapperResult, IQuery, IQueryResult, ISourceMapper, IToQuery} from "@leight-core/api";

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
	const where = toFilter?.(filter);
	return toResult<IMapperResult<TMapper>>(
		size,
		source.count({where}),
		mapper(source.findMany({
			where,
			orderBy,
		}))
	)
}
