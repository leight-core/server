import {IPrismaTransaction, IPromiseMapper, IQuery, ISource, ISourceEntity, ISourceItem, ISourceQuery} from "@leight-core/api";
import {User} from "@leight-core/server";

export interface ISourceRequest<TEntity, TItem, TQuery extends IQuery<any, any>> extends Pick<ISource<TEntity, any, TQuery>, "count" | "query" | "get" | "find"> {
	name: string;
	prisma: IPrismaTransaction;
	source?: Partial<ISource<TEntity, TItem, TQuery>>;

	map(source: TEntity): Promise<TItem>;

	map(source: TEntity): Promise<TItem>;
}

export const Source = <T extends ISource<any, any, IQuery<any, any>>>(
	{
		name,
		prisma,
		source,
		map,
		...request
	}: ISourceRequest<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>> & Omit<T, keyof ISource<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>>>): T => {
	const defaultMapper: ISource<ISourceEntity<T>, any, ISourceQuery<T>>["mapper"] = {
		map,
		list: async source => Promise.all((await source).map(map)),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $source: ISource<ISourceEntity<T>, any, ISourceQuery<T>> = {
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
				return await $source.find(query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		withDefaultMapper: () => {
			$mapper = defaultMapper;
			return $source;
		},
		withMapper: <U>(mapper: IPromiseMapper<ISourceEntity<T>, U>): ISource<ISourceEntity<T>, U, ISourceQuery<T>> => {
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
		...request,
		...source,
	};

	return $source as ISource<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>> & T;
};
