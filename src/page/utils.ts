import {GetServerSideProps, GetServerSidePropsContext} from "next";
import {ParsedUrlQuery} from "querystring";
import {IRepositoryService} from "@leight-core/api";

export const handlePageFetch = <TProps, TQuery extends ParsedUrlQuery, TRepositoryService extends IRepositoryService<any, any, any, any>>(
	key: keyof TProps,
	query: keyof TQuery,
	repositoryService: TRepositoryService,
	mapper: (fetch: NonNullable<Awaited<ReturnType<typeof repositoryService.fetch>>>) => Promise<any>,
): GetServerSideProps<TProps, TQuery> => {
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
