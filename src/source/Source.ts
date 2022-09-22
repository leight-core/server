import {
	ClientError,
	IImportHandlers,
	IPrismaTransaction,
	IPromiseMapper,
	IQueryFilter,
	ISource,
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
import {Prisma} from "@prisma/client";
import LRUCache from "lru-cache";
import {GetServerSideProps} from "next";
import crypto from "node:crypto";

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
		this.mapper = PromiseMapper(this.map.bind(this));
		this.cache = undefined;
	}

	async create(create: ISourceCreate<TSource>): Promise<ISourceEntity<TSource>> {
		return onUnique(
			async () => {
				const result = await this.$create(create);
				await this.clearCache();
				return result;
			},
			async e => {
				if (e instanceof Prisma.PrismaClientKnownRequestError && Array.isArray(e.meta?.target)) {
					throw new ClientError(`Unique error on [${this.name}.${(e.meta?.target?.join(","))}]`);
				}
				throw new ClientError(e.message, 409);
			}
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $create(create: ISourceCreate<TSource>): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item creation.`);
	}

	async patch(patch: UndefinableOptional<ISourceCreate<TSource>> & IWithIdentity): Promise<ISourceEntity<TSource>> {
		return onUnique(
			async () => {
				const result = await this.$patch(patch);
				await this.clearCache();
				return result;
			},
			async e => {
				if (e instanceof Prisma.PrismaClientKnownRequestError && Array.isArray(e.meta?.target)) {
					throw new ClientError(`Unique error on [${this.name}.${(e.meta?.target?.join(","))}]`);
				}
				throw new ClientError(e.message, 409);
			}
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $patch(patch: UndefinableOptional<ISourceCreate<TSource>> & IWithIdentity): Promise<ISourceEntity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item patching.`);
	}

	async import(create: ISourceCreate<TSource>): Promise<ISourceEntity<TSource>> {
		return onUnique(
			() => this.$create(create),
			async () => {
				return this.$patch({
					id: (await this.createToId(create)).id,
					...create,
				});
			}
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async createToId(create: ISourceCreate<TSource>): Promise<{ id: string }> {
		throw new Error(`Source [${this.name}] does not support mapping Create object to an ID.`);
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
			[this.name]: () => {
				return {
					withUser: this.withUser.bind(this),
					handler: this.import.bind(this),
				};
			},
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
