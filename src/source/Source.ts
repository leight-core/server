import {IPrismaTransaction, IPromiseMapper, IQuery, IQueryFilter, ISource} from "@leight-core/api";
import {User} from "@leight-core/server";
import {IOfPrismaRequest, ofPrisma} from "./ofPrisma";

export interface ISourceRequest<TEntity, TItem, TQuery extends IQuery<any, any>> {
	name: string;
	prisma: IPrismaTransaction;
	source: IOfPrismaRequest<TQuery, TEntity>;

	filter?(filter: IQueryFilter<TQuery>): IQueryFilter<TQuery>;

	map(source: TEntity): Promise<TItem>;
}

export const Source = <TEntity, TItem, TQuery extends IQuery<any, any>>(request: ISourceRequest<TEntity, TItem, TQuery>): ISource<TEntity, TItem, TQuery> => {
	const defaultMapper: ISource<TEntity, any, TQuery>["mapper"] = {
		map: request.map,
		list: async source => Promise.all((await source).map(async item => await request.map(item))),
	};
	let $prisma = request.prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $ofPrisma = ofPrisma(request.source);

	const source: ISource<TEntity, any, TQuery> = {
		name: request.name,
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
		filter: request.filter || (filter => filter),
		withDefaultMapper: () => {
			$mapper = defaultMapper;
			return source;
		},
		withMapper: <T>(mapper: IPromiseMapper<TEntity, T>): ISource<TEntity, T, TQuery> => {
			$mapper = mapper;
			return source;
		},
		withUser: user => {
			$user = user;
			return source;
		},
		withUserId: id => {
			$user = User(id);
			return source;
		},
		withPrisma: prisma => {
			$prisma = prisma;
			return source;
		},
		...$ofPrisma,
	};

	return source;
};
