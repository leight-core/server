import {IMapperResult, IQuery, ISourceMapper, IToQuery} from "@leight-core/api";
import {toResult} from "@leight-core/server";

export const toQuery = <TMapper extends ISourceMapper<any, any>, TQuery extends IQuery<any, any>>(
	{
		query: {page, size, filter, orderBy},
		toFilter = filter => filter,
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
			take: size,
			skip: page && size && size * page,
		}))
	);
};
