// export const toQuery = <TMapper extends ISourceMapper<any, any>, TQuery extends IQuery<any, any>>(
// 	{
// 		request: {page, size, filter, orderBy},
// 		toFilter = filter => filter,
// 		source,
// 		mapper,
// 	}: IToQuery<TMapper, TQuery>) => {
// 	const where = toFilter?.(filter);
// 	return mapper(source.findMany({
// 		where,
// 		orderBy,
// 		take: size,
// 		skip: page && size && size * page,
// 	}));
// };
