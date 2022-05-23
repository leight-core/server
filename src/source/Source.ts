import {IPrismaTransaction, IPromiseMapper, IQuery, IQueryFilter, ISource} from "@leight-core/api";
import {IOfPrismaRequest, ofPrisma, User} from "@leight-core/server";
import {merge} from "@leight-core/utils";

export interface ISourceRequest<TEntity, TItem, TQuery extends IQuery<any, any>> extends Partial<ISource<TEntity, TItem, TQuery>> {
	name: string;
	prisma: IPrismaTransaction;
	source: IOfPrismaRequest<TQuery, TEntity>;

	map(source: TEntity): Promise<TItem>;
}

export const Source = <TEntity, TItem, TQuery extends IQuery<any, any>>({name, prisma, source, map, ...request}: ISourceRequest<TEntity, TItem, TQuery>): ISource<TEntity, TItem, TQuery> => {
	const defaultMapper: ISource<TEntity, any, TQuery>["mapper"] = {
		map,
		list: async source => Promise.all((await source).map(map)),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $ofPrisma = ofPrisma(source);

	const $source: ISource<TEntity, any, TQuery> = {
		name,
		get prisma() {
			return $prisma;
		},
		get mapper() {
			return $mapper;
		},
		get user() {
			return $user;
		},
		fetch: async query => {
			try {
				return await $ofPrisma.find(query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		filter: filter => merge<IQueryFilter<TQuery>, IQueryFilter<TQuery>>(filter || {}, request.filter?.(filter) || filter || {}),
		withDefaultMapper: () => {
			$mapper = defaultMapper;
			return $source;
		},
		withMapper: <T>(mapper: IPromiseMapper<TEntity, T>): ISource<TEntity, T, TQuery> => {
			$mapper = mapper;
			return $source;
		},
		withUser: user => {
			$user = user;
			return $source;
		},
		withUserId: id => {
			$user = User(id);
			return $source;
		},
		withPrisma: prisma => {
			$prisma = prisma;
			return $source;
		},
		...$ofPrisma,
		...request,
	};

	return $source;
};
