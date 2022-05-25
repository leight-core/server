import {IPrismaTransaction, IPromiseMapper, IQuery, ISource, ISourceCreate, ISourceEntity, ISourceFetch, ISourceFetchParams, ISourceItem, ISourceQuery} from "@leight-core/api";
import {User, withFetch} from "@leight-core/server";
import {ParsedUrlQuery} from "querystring";

export interface ISourceRequest<TCreate, TEntity, TItem, TQuery extends IQuery<any, any>, TFetch = never, TFetchParams extends ParsedUrlQuery = never> {
	name: string;
	prisma: IPrismaTransaction;
	source?: Omit<Partial<ISource<TCreate, TEntity, TItem, TQuery, TFetch, TFetchParams>>, "name" | "prisma">;

	map(source?: TEntity | null): Promise<TItem | null | undefined>;
}

export const Source = <T extends ISource<any, any, any, IQuery<any, any>, any, any>>(
	{
		name,
		prisma,
		source,
		map,
		...request
	}: ISourceRequest<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> & Omit<T, keyof ISource<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>>): T => {
	const defaultMapper: ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>["mapper"] = {
		map,
		list: async source => (await Promise.all((await source).map(map))).filter(i => i),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $source: ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> = {
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
		create: async () => {
			throw new Error(`Source [${name}] does not support item creation.`);
		},
		delete: async () => {
			throw new Error(`Source [${name}] does not support item deletion.`);
		},
		get: async () => {
			throw new Error(`Source [${name}] does not support getting an item by an id.`);
		},
		find: async () => {
			throw new Error(`Source [${name}] does not support finding an item by a query.`);
		},
		query: async () => {
			throw new Error(`Source [${name}] does not support querying items.`);
		},
		count: async () => {
			throw new Error(`Source [${name}] does not support counting items by a query.`);
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
		withMapper: <U>(mapper: IPromiseMapper<ISourceEntity<T>, U>): ISource<ISourceCreate<T>, ISourceEntity<T>, U, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> => {
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
		withFetch: (key, query) => withFetch<ISourceFetch<T>, ISourceFetchParams<T>, ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>>($source)(key, query),
		map: $mapper.map,
		...request,
		...source,
	};

	return $source as ISource<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> & T;
};
