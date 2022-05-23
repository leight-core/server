import {IPromiseMapper, IQuery, ISource} from "@leight-core/api";
import {User} from "@leight-core/server";

export interface ISourceRequest<TCreate, TEntity, TItem, TQuery extends IQuery<any, any>> extends Omit<ISource<TCreate, TEntity, TItem, TQuery>, "fetch" | "mapper" | "user" | "withUser" | "delete" | "withMapper" | "withDefaultMapper" | "withPrisma"> {
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

	const source: ISource<TCreate, TEntity, any, TQuery> = {
		name: request.name,
		prisma: $prisma,
		mapper: $mapper,
		user: $user,
		create: create => request.create.call(source, create),
		delete: ids => {
			if (!request.delete) {
				throw new Error(`Delete is not supported on [${request.name}] source.`);
			}
			return request.delete.call(source, ids);
		},
		query: query => request.query.call(source, query),
		fetch: async query => {
			try {
				return await request.find.call(source, query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		find: query => request.find.call(source, query),
		get: id => request.get.call(source, id),
		count: query => request.count.call(source, query),
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
		}
	};

	return source;
};
