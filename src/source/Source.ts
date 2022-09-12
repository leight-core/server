import {
	ClientError,
	IImportHandlers,
	IPrismaTransaction,
	IPromiseMapper,
	IQuery,
	IQueryFilter,
	ISource,
	ISourceAcl,
	ISourceCreate,
	ISourceEntity,
	ISourceFetch,
	ISourceFetchParams,
	ISourceItem,
	ISourceQuery,
	IUser,
	IWithIdentity,
	UndefinableOptional
} from "@leight-core/api";
import {onUnique, User, withFetch} from "@leight-core/server";
import {PromiseMapper} from "@leight-core/utils";
import LRUCache from "lru-cache";
import {GetServerSideProps} from "next";
import crypto from "node:crypto";
import {ParsedUrlQuery} from "querystring";

export abstract class AbstractSource<TSource extends ISource<any, any, any>> implements ISource<ISourceCreate<TSource>, ISourceEntity<TSource>, ISourceItem<TSource>, ISourceQuery<TSource>, ISourceFetch<TSource>, ISourceFetchParams<TSource>> {
	readonly mapper: IPromiseMapper<ISourceEntity<TSource>, ISourceItem<TSource>>;
	readonly name: string;
	prisma: IPrismaTransaction;
	user: IUser;
	readonly cache?: {
		count?: LRUCache<string, number>;
		query?: LRUCache<string, ISourceEntity<TSource>[]>;
	};

	constructor(name: string, prisma: IPrismaTransaction, user: IUser = User()) {
		this.name = name;
		this.prisma = prisma;
		this.user = user;
		this.mapper = PromiseMapper(this.map);
		this.cache = undefined;
	}

	async create(create: ISourceCreate<TSource>): Promise<ISourceEntity<TSource>> {
		try {
			const result = await this.$create(create);
			await this.clearCache();
			return result;
		} catch (e) {
			return onUnique(e, async () => {
				throw new ClientError(`Unique error on [${this.name}].`, 409);
			});
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $create(create: ISourceCreate<TSource>): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item creation.`);
	}

	async patch(patch: UndefinableOptional<ISourceCreate<TSource>> & IWithIdentity): Promise<ISourceEntity<TSource>> {
		const result = await this.$patch(patch);
		await this.clearCache();
		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $patch(patch: UndefinableOptional<ISourceCreate<TSource>> & IWithIdentity): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item patching.`);
	}

	async remove(ids: string[]): Promise<ISourceEntity<TSource>[]> {
		const result = await this.$remove(ids);
		await this.clearCache();
		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $remove(ids: string[]): Promise<ISourceEntity<TSource>[]> {
		throw new Error(`Source [${this.name}] does not support item deletion.`);
	}

	async get(id: string): Promise<ISourceEntity<TSource>> {
		return this.$get(id);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $get(id: string): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support getting an item by an id.`);
	}

	async fetch(query: ISourceQuery<TSource>): Promise<ISourceEntity<TSource> | null> {
		try {
			return await this.find(query);
		} catch (e) {
			console.warn(e);
			return null;
		}
	}

	async find(query: ISourceQuery<TSource>): Promise<ISourceEntity<TSource>> {
		return this.$find(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $find(query: ISourceQuery<TSource>): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support finding an item by a query.`);
	}

	async query(query: ISourceQuery<TSource>): Promise<ISourceEntity<TSource>[]> {
		const hash = this.hashOf(query, "query");
		if (this.cache?.query && !this.cache?.query?.has(hash)) {
			this.cache?.query?.set(hash, await this.$query(query));
		}
		return this.cache?.query?.get(hash) || this.$query(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $query(query: ISourceQuery<TSource>): Promise<ISourceEntity<TSource>[]> {
		throw new Error(`Source [${this.name}] does not support querying items.`);
	}

	async count(query: ISourceQuery<TSource>): Promise<number> {
		const hash = this.hashOf(query, "count");
		if (this.cache?.count && !this.cache?.count?.has(hash)) {
			this.cache?.count?.set(hash, await this.$count(query));
		}
		return this.cache?.count?.get(hash) || this.$count(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $count(query: ISourceQuery<TSource>): Promise<number> {
		throw new Error(`Source [${this.name}] does not support counting items by a query.`);
	}

	withFilter({filter}: ISourceQuery<TSource>): IQueryFilter<ISourceQuery<TSource>> | undefined {
		return filter;
	}

	importers(): IImportHandlers {
		return {
			[this.name]: () => ({
				withUser: this.withUser,
				handler: this.create,
			}),
		};
	}

	withPrisma(prisma: IPrismaTransaction): this {
		this.prisma = prisma;
		return this;
	}

	withUser(user: IUser): this {
		this.user = user;
		return this;
	}

	ofSource(source: ISource<any, any, any>): this {
		this.withPrisma(source.prisma);
		this.withUser(source.user);
		return this;
	}

	withFetch(key: keyof ISourceFetch<TSource>, query: keyof ISourceFetchParams<TSource>): GetServerSideProps<ISourceFetch<TSource>, ISourceFetchParams<TSource>> {
		return withFetch<ISourceFetch<TSource>, ISourceFetchParams<TSource>, ISource<ISourceCreate<TSource>, ISourceEntity<TSource>, ISourceItem<TSource>, ISourceQuery<TSource>, ISourceFetch<TSource>, ISourceFetchParams<TSource>>>(this)(key, query);
	}

	hashOf(query: ISourceQuery<TSource>, type?: string): string {
		return crypto.createHash("sha256").update(JSON.stringify({
			query,
			type,
			userId: this.user.optional(),
		})).digest("hex");
	}

	async clearCache(): Promise<any> {
		this.cache?.query?.clear();
		this.cache?.count?.clear();
		await this.$clearCache();
	}

	async $clearCache(): Promise<any> {
	}

	async mapNull(source?: ISourceEntity<TSource> | null): Promise<ISourceItem<TSource> | undefined> {
		return source ? this.map(source) : undefined;
	}

	async list(source: Promise<ISourceEntity<TSource>[]>): Promise<ISourceItem<TSource>[]> {
		return this.mapper.list(source);
	}

	abstract map(source: ISourceEntity<TSource>): Promise<ISourceItem<TSource>>;
}

export interface ISourceRequest<TCreate, TEntity, TItem, TQuery extends IQuery = IQuery, TFetch extends Record<string, any> = any, TFetchParams extends ParsedUrlQuery = any> {
	name: string;
	prisma: IPrismaTransaction;
	source?: Omit<Partial<ISource<TCreate, TEntity, TItem, TQuery, TFetch, TFetchParams>>, "name" | "prisma">;
	cache?: {
		count?: LRUCache<string, number>;
		query?: LRUCache<string, TEntity[]>;
	};
	acl?: ISourceAcl;

	map(source: TEntity): Promise<TItem>;
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
			remove: $delete = async () => {
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
			withFilter: $withFilter = ({filter}: ISourceQuery<T>) => filter,
			clearCache: $clearCache,
			...source
		} = {},
		acl,
		map,
		cache,
		...request
	}: ISourceRequest<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>> & Omit<T, keyof ISource<ISourceCreate<T>, ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>, ISourceFetch<T>, ISourceFetchParams<T>>>): T => {
	const $mapper = PromiseMapper(map);
	let $prisma = prisma;
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
		(acl.remove = (acl.remove || [])).push(
			`${name}.remove`,
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
		remove: async ids => {
			$source.user.checkAny((acl?.default || []).concat(acl?.remove || []));
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
		withFilter: $withFilter,
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
		map,
		mapNull: async source => source ? map(source) : undefined,
		list: $mapper.list,
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
