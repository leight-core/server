import {IQueryResult} from "@leight-core/api";
import {mapOf} from "@leight-core/utils";

export const itemsOf = async <T, R, U>(source: Promise<T[]>, map: (item: T) => R, mapper: (item: R) => Promise<U>): Promise<IQueryResult<U>> => {
	const items = await mapOf(source, map, mapper);
	return {
		items,
		count: items.length,
		total: items.length,
	};
};
