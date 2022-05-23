import {IPromiseMapper, ISource, ISourceEntity, IToPage} from "@leight-core/api";
import {GetServerSidePropsContext} from "next";
import {ParsedUrlQuery} from "querystring";

export const toPage = <TToPage, TToPageQueryParams extends ParsedUrlQuery, TSource extends ISource<any, any, any>>(source: TSource, mapper: IPromiseMapper<ISourceEntity<TSource>, any>): IToPage<TToPage, TToPageQueryParams> => (key, query) => async (context: GetServerSidePropsContext<any>): Promise<any> => {
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
				[key]: await mapper(item),
			}
		};
	} catch (e) {
		console.error(e);
		return {
			notFound: true,
		};
	}
};
