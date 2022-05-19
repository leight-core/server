import {IQueryResult} from "@leight-core/api";

export async function toResult<TResult>(size: number | undefined, total: Promise<number>, items: Promise<TResult[]>): Promise<IQueryResult<TResult>> {
	const $items = await items;
	const $total = await total;
	return {
		count: $items.length,
		size,
		total: $total,
		pages: size && Math.ceil($total / Math.max(size, 1)),
		items: $items,
	};
}
