import {IQuery, IQueryResult, IToQuery} from "@leight-core/api";

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

export const toQuery = <TEntity, TResult, TQuery extends IQuery<TFilter, TOrderBy>, TFilter, TOrderBy>(toQuery: IToQuery<TEntity, TResult, TQuery, TFilter, TOrderBy>) => toResult<TResult>(
	toQuery.query.size,
	toQuery.source.count(),
	toQuery.mapper(toQuery.source.findMany({
		where: toQuery.query.filter,
		orderBy: toQuery.query.orderBy,
	}))
)
