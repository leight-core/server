import {ISource,}           from "@leight-core/api";
import {getTokenUser}       from "@leight-core/server";
import {GetServerSideProps} from "next";

export const withFetch = <TKey extends string, TSource extends ISource<any, any, any, any>>(source: TSource, key: TKey, query: string): GetServerSideProps => async context => {
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
