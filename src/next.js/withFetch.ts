import {ISource,}                  from "@leight-core/api";
import {getTokenUser}              from "@leight-core/server";
import {GetServerSidePropsContext} from "next";
import {ParsedUrlQuery}            from "querystring";

export const withFetch = <TKeys extends Record<string, any>, TParams extends ParsedUrlQuery, TSource extends ISource<any, any, any, any>>(source: TSource) => (key: keyof TKeys, query: keyof TParams) => async (context: GetServerSidePropsContext<TParams>): Promise<any> => {
	source.container.withUser(await getTokenUser(context));
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
				[key]: await source.mapper.toItem.map(item),
			}
		};
	} catch (e) {
		console.error(e);
		return {
			notFound: true,
		};
	}
};
