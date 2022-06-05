import {ISource, IWithFetch} from "@leight-core/api";
import {GetServerSidePropsContext} from "next";
import {ParsedUrlQuery} from "querystring";

export const withFetch = <TWithFetch, TWithFetchParams extends ParsedUrlQuery, TSource extends ISource<any, any, any, any>>(source: TSource): IWithFetch<TWithFetch, TWithFetchParams> => (key, query) => async (context: GetServerSidePropsContext<TWithFetchParams>): Promise<any> => {
	if (!context.params?.[query]) {
		return {
			notFound: true,
		};
	}
	try {
		const item = await source.get(context.params[query] as string);
		if (!item) {
			return {
				notFound: true,
			};
		}
		return {
			props: {
				[key]: await source.mapper.map(item),
			}
		};
	} catch (e) {
		console.error(e);
		return {
			notFound: true,
		};
	}
};
