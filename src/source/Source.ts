import {ClientError, IPrismaTransaction, IPromiseMapper, IQuery, ISource, ISourceAcl, ISourceCreate, ISourceEntity, ISourceFetch, ISourceFetchParams, ISourceItem, ISourceQuery} from "@leight-core/api";
import {onUnique, User, withFetch} from "@leight-core/server";
import LRUCache from "lru-cache";
import crypto from "node:crypto";
import {ParsedUrlQuery} from "querystring";

export interface ISourceRequest<TCreate, TEntity, TItem, TQuery extends IQuery = IQuery, TFetch = any, TFetchParams extends ParsedUrlQuery = any> {
	name: string;
	prisma: IPrismaTransaction;
	source?: Omit<Partial<ISource<TCreate, TEntity, TItem, TQuery, TFetch, TFetchParams>>, "name" | "prisma">;
	cache?: {
		count?: LRUCache<string, number>;
		query?: LRUCache<string, TEntity[]>;
	};
	acl?: ISourceAcl;

	map(source?: TEntity | null): Promise<TItem | null>;
}

export const Source = <T extends ISource<any, any, any>>(
	{
		name,
		prisma,
		source: {
			create: $create = async () => {
				throw new Error(`Source [${name}] does not support item creation.`);
			},
			patch: $patch = async () => {
				throw new Error(`Source [${name}] does not support item patching.`);
			},
			delete: $delete = async () => {
				throw new Error(`Source [${name}] does not support item deletion.`);
			},
			get: $get = async () => {
				throw new Error(`Source [${name}] does not support getting an item by an id.`);
			},
			find: $find = async () => {
				throw new Error(`Source [${name}] does not support finding an item by a query.`);
			},
			query: $query = async () => {
				throw new Error(`Source [${name}] does not support querying items.`);
			},
			count: $count = async () => {
				throw new Error(`Source [${name}] does not support counting items by a query.`);
			},
			clearCache: $clearCache,
			...source
		} = {},
		acl,
		map,
		cache,
		...request
	}: ISourceRequest<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> & Omit<T, keyof ISource<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>>): T => {
	const defaultMapper: ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>["mapper"] = {
		map,
		list: async source => (await Promise.all((await source).map(map))).filter(i => i),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	if (acl?.lock) {
		(acl.default = (acl.default || [])).push(
			`*`,
		);
		(acl.create = (acl.create || [])).push(
			`${name}.create`,
			`${name}.write`,
		);
		(acl.mapper = (acl.mapper || [])).push(
			`${name}.mapper`,
			`${name}.read`,
		);
		(acl.patch = (acl.patch || [])).push(
			`${name}.patch`,
			`${name}.write`,
		);
		(acl.delete = (acl.delete || [])).push(
			`${name}.delete`,
		);
		(acl.get = (acl.get || [])).push(
			`${name}.get`,
			`${name}.read`,
		);
		(acl.find = (acl.find || [])).push(
			`${name}.find`,
			`${name}.read`,
		);
		(acl.query = (acl.query || [])).push(
			`${name}.query`,
			`${name}.read`,
		);
		(acl.count = (acl.count || [])).push(
			`${name}.count`,
			`${name}.read`,
		);
		(acl.fetch = (acl.fetch || [])).push(
			`${name}.fetch`,
			`${name}.read`,
		);
	}

	const $source: ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> = {
		name,
		get prisma() {
			return $prisma;
		},
		get mapper() {
			$source.user.checkAny((acl?.default || []).concat(acl?.mapper || []));
			return $mapper;
		},
		get user() {
			return $user;
		},
		create: async create => {
			$source.user.checkAny((acl?.default || []).concat(acl?.create || []));
			try {
				const result = await $create(create);
				await $source.clearCache();
				return result;
			} catch (e) {
				return onUnique(e, async () => {
					throw new ClientError(`Unique error on [${name}].`, 409);
				});
			}
		},
		patch: async patch => {
			$source.user.checkAny((acl?.default || []).concat(acl?.patch || []));
			const result = await $patch(patch);
			await $source.clearCache();
			return result;
		},
		delete: async ids => {
			$source.user.checkAny((acl?.default || []).concat(acl?.delete || []));
			const result = await $delete(ids);
			await $source.clearCache();
			return result;
		},
		get: async id => {
			$source.user.checkAny((acl?.default || []).concat(acl?.get || []));
			return $get(id);
		},
		find: async query => {
			$source.user.checkAny((acl?.default || []).concat(acl?.find || []));
			return $find(query);
		},
		query: async query => {
			$source.user.checkAny((acl?.default || []).concat(acl?.query || []));
			const hash = $source.hashOf(query, "query");
			if (!cache?.query?.has(hash)) {
				cache?.query?.set(hash, await $query(query));
			}
			return cache?.query?.get(hash) || $query(query);
		},
		count: async query => {
			$source.user.checkAny((acl?.default || []).concat(acl?.count || []));
			const hash = $source.hashOf(query, "count");
			if (!cache?.count?.has(hash)) {
				cache?.count?.set(hash, await $count(query));
			}
			return cache?.count?.get(hash) || $count(query);
		},
		fetch: async query => {
			$source.user.checkAny((acl?.default || []).concat(acl?.fetch || []));
			try {
				return await $source.find(query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		importers: () => ({
			[name]: () => ({
				withUser: $source.withUser,
				handler: $source.create,
			}),
		}),
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
		withPrisma: prisma => {
			$prisma = prisma;
			return $source;
		},
		ofSource: source => {
			$source.withPrisma(source.prisma);
			$source.withUser(source.user);
			return $source;
		},
		withFetch: (key, query) => withFetch<ISourceFetch<T>, ISourceFetchParams<T>, ISource<ISourceCreate<T>, ISourceEntity<T>, any, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>>($source)(key, query),
		map: source => $source.mapper.map(source as ISourceEntity<any>) || null,
		hashOf: (query, type) => crypto.createHash("sha256").update(JSON.stringify({
			query,
			type,
			userId: $source.user.optional(),
		})).digest("hex"),
		clearCache: async () => {
			cache?.query?.clear();
			cache?.count?.clear();
			return $clearCache?.();
		},
		...request,
		...source,
	};

	return $source as ISource<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> & T;
};
