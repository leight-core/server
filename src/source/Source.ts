import {IPrismaTransaction, IPromiseMapper, IQuery, ISource} from "@leight-core/api";
import {User} from "@leight-core/server";
import {IOfPrismaRequest, ofPrisma} from "./ofPrisma";

export interface ISourceRequest<TCreate, TEntity, TItem, TQuery extends IQuery<any, any>> {
	name: string;
	prisma: IPrismaTransaction;
	source: IOfPrismaRequest<TQuery, TEntity>;
	create: ISource<TCreate, TEntity, TItem, TQuery>["create"];
	delete?: ISource<TCreate, TEntity, TItem, TQuery>["delete"];

	map(source: TEntity): Promise<TItem>;
}

export const Source = <TCreate, TEntity, TItem, TQuery extends IQuery<any, any>>(request: ISourceRequest<TCreate, TEntity, TItem, TQuery>): ISource<TCreate, TEntity, TItem, TQuery> => {
	const defaultMapper: ISource<TCreate, TEntity, any, TQuery>["mapper"] = {
		map: request.map,
		list: async source => Promise.all((await source).map(async item => await request.map(item))),
	};
	let $prisma = request.prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $ofPrisma = ofPrisma(request.source);

	const source: ISource<TCreate, TEntity, any, TQuery> = {
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
		create: request.create,
		delete: ids => {
			if (!request.delete) {
				throw new Error(`Delete is not supported on [${request.name}] source.`);
			}
			return request.delete(ids);
		},
		fetch: async query => {
			try {
				return await $ofPrisma.find(query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		withDefaultMapper: () => {
			$mapper = defaultMapper;
			return source;
		},
		withMapper: <T>(mapper: IPromiseMapper<TEntity, T>): ISource<TCreate, TEntity, T, TQuery> => {
			$mapper = mapper;
			return source;
		},
		withUser: user => {
			$user = user;
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
