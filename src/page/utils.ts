import {GetServerSidePropsContext} from "next";
import {ParsedUrlQuery} from "querystring";

export const handlePageFetch = <TProps, TQuery extends ParsedUrlQuery, TFetch extends (id: string) => Promise<any>>(
	key: keyof TProps,
	query: keyof TQuery,
	fetch: TFetch,
	mapper: (fetch: NonNullable<Awaited<ReturnType<TFetch>>>) => Promise<any>,
): any => {
	return async (ctx: GetServerSidePropsContext<TQuery>): Promise<any> => {
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
	}
}
