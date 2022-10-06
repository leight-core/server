import {
	ClientError,
	IImportHandlers,
	IPrismaTransaction,
	IPromiseMapper,
	ISource,
	IUser,
	IWithIdentity,
	QueryInfer,
	SourceInfer,
	UndefinableOptional
}                           from "@leight-core/api";
import {
	onUnique,
	User,
	withFetch
}                           from "@leight-core/server";
import {PromiseMapper}      from "@leight-core/utils";
import {Prisma}             from "@prisma/client";
import LRUCache             from "lru-cache";
import {GetServerSideProps} from "next";
import crypto               from "node:crypto";

export abstract class AbstractSource<//
	TSource extends ISource<any, any, any>,
	> implements ISource<//
	SourceInfer.Create<TSource>,
	SourceInfer.Entity<TSource>,
	SourceInfer.Item<TSource>,
	SourceInfer.Query<TSource>,
	SourceInfer.Fetch<TSource>,
	SourceInfer.FetchParams<TSource>,
	SourceInfer.Backup<TSource>> {
	readonly mapper: IPromiseMapper<SourceInfer.Entity<TSource>, SourceInfer.Item<TSource>>;
	readonly name: string;
	prisma: IPrismaTransaction;
	user: IUser;
	cache?: {
		count?: LRUCache<string, number>;
		query?: LRUCache<string, SourceInfer.Entity<TSource>[]>;
	};

	protected constructor(name: string, prisma: IPrismaTransaction, user: IUser = User()) {
		this.name   = name;
		this.prisma = prisma;
		this.user   = user;
		this.mapper = PromiseMapper(this.map.bind(this));
		this.cache  = undefined;
	}

	async create(create: SourceInfer.Create<TSource>): Promise<SourceInfer.Entity<TSource>> {
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
	async $create(create: SourceInfer.Create<TSource>): Promise<SourceInfer.Entity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item creation.`);
	}

	async patch(patch: UndefinableOptional<SourceInfer.Create<TSource>> & IWithIdentity): Promise<SourceInfer.Entity<TSource>> {
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
	async $patch(patch: UndefinableOptional<SourceInfer.Create<TSource>> & IWithIdentity): Promise<SourceInfer.Entity<TSource>> {
		throw new Error(`Source [${this.name}] does not support item patching.`);
	}

	async import(create: SourceInfer.Create<TSource>): Promise<SourceInfer.Entity<TSource>> {
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
	async backup(entity: SourceInfer.Entity<TSource>): Promise<SourceInfer.Backup<TSource> | undefined> {
		throw entity;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async restore(backup?: SourceInfer.Backup<TSource>): Promise<SourceInfer.Entity<TSource> | undefined> {
		throw new Error(`Source [${this.name}] does not support restoring backups.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async createToId(create: SourceInfer.Create<TSource>): Promise<{ id: string }> {
		throw new Error(`Source [${this.name}] does not support mapping Create object to an ID.`);
	}

	async remove(ids: string[]): Promise<SourceInfer.Entity<TSource>[]> {
		const result = await this.$remove(ids);
		await this.clearCache();
		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $remove(ids: string[]): Promise<SourceInfer.Entity<TSource>[]> {
		throw new Error(`Source [${this.name}] does not support item deletion.`);
	}

	async get(id: string): Promise<SourceInfer.Entity<TSource>> {
		return this.$get(id);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $get(id: string): Promise<SourceInfer.Entity<TSource>> {
		throw new Error(`Source [${this.name}] does not support getting an item by an id.`);
	}

	async fetch(query: SourceInfer.Query<TSource>): Promise<SourceInfer.Entity<TSource> | null> {
		try {
			return await this.find(query);
		} catch (e) {
			console.warn(e);
			return null;
		}
	}

	async find(query: SourceInfer.Query<TSource>): Promise<SourceInfer.Entity<TSource>> {
		return this.$find(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $find(query: SourceInfer.Query<TSource>): Promise<SourceInfer.Entity<TSource>> {
		throw new Error(`Source [${this.name}] does not support finding an item by a query.`);
	}

	async query(query: SourceInfer.Query<TSource>): Promise<SourceInfer.Entity<TSource>[]> {
		const hash = this.hashOf(query, "query");
		if (this.cache?.query && !this.cache?.query?.has(hash)) {
			this.cache?.query?.set(hash, await this.$query(query));
		}
		return this.cache?.query?.get(hash) || this.$query(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $query(query: SourceInfer.Query<TSource>): Promise<SourceInfer.Entity<TSource>[]> {
		throw new Error(`Source [${this.name}] does not support querying items.`);
	}

	async count(query: SourceInfer.Query<TSource>): Promise<number> {
		const hash = this.hashOf(query, "count");
		if (this.cache?.count && !this.cache?.count?.has(hash)) {
			this.cache?.count?.set(hash, await this.$count(query));
		}
		return this.cache?.count?.get(hash) || this.$count(query);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async $count(query: SourceInfer.Query<TSource>): Promise<number> {
		throw new Error(`Source [${this.name}] does not support counting items by a query.`);
	}

	withFilter({filter}: SourceInfer.Query<TSource>): QueryInfer.Filter<SourceInfer.Query<TSource>> | undefined {
		return filter;
	}

	importers(): IImportHandlers {
		return {
			[this.name]: () => {
				return {
					withUser: this.withUser.bind(this),
					handler:  this.import.bind(this),
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

	ofSource(source?: ISource<any, any, any>): this {
		if (!source) {
			return this;
		}
		this.withPrisma(source.prisma);
		this.withUser(source.user);
		return this;
	}

	withFetch(key: keyof SourceInfer.Fetch<TSource>, query: keyof SourceInfer.FetchParams<TSource>): GetServerSideProps<SourceInfer.Fetch<TSource>, SourceInfer.FetchParams<TSource>> {
		return withFetch<SourceInfer.Fetch<TSource>, SourceInfer.FetchParams<TSource>, ISource<SourceInfer.Create<TSource>, SourceInfer.Entity<TSource>, SourceInfer.Item<TSource>, SourceInfer.Query<TSource>, SourceInfer.Fetch<TSource>, SourceInfer.FetchParams<TSource>, SourceInfer.Backup<TSource>>>(this)(key, query);
	}

	hashOf(query: SourceInfer.Query<TSource>, type?: string): string {
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

	async mapNull(source?: SourceInfer.Entity<TSource> | null): Promise<SourceInfer.Item<TSource> | undefined> {
		return source ? this.map(source) : undefined;
	}

	async list(source: Promise<SourceInfer.Entity<TSource>[]>): Promise<SourceInfer.Item<TSource>[]> {
		return this.mapper.list(source);
	}

	abstract map(source: SourceInfer.Entity<TSource>): Promise<SourceInfer.Item<TSource>>;
}
