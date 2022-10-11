import {
	ClientError,
	IContainer,
	IPromiseMapper,
	ISource,
	IWithIdentity,
	QueryInfer,
	SourceInfer,
	UndefinableOptional
}                      from "@leight-core/api";
import {onUnique}      from "@leight-core/server";
import {PromiseMapper} from "@leight-core/utils";
import {Prisma}        from "@prisma/client";
import LRUCache        from "lru-cache";
import crypto          from "node:crypto";

export abstract class AbstractSource<//
	TSource extends ISource<IContainer, any, any>,
	> implements ISource<//
	SourceInfer.Container<TSource>,
	SourceInfer.Entity<TSource>,
	SourceInfer.Item<TSource>,
	SourceInfer.Query<TSource>,
	SourceInfer.Create<TSource>,
	SourceInfer.Backup<TSource>> {
	readonly name: string;
	readonly mapper: { toItem: IPromiseMapper<SourceInfer.Entity<TSource>, SourceInfer.Item<TSource>> };

	container: SourceInfer.Container<TSource>;
	cache?: {
		count?: LRUCache<string, number>;
		query?: LRUCache<string, SourceInfer.Entity<TSource>[]>;
	};

	protected constructor(name: string, container: SourceInfer.Container<TSource>) {
		this.name      = name;
		this.container = container;
		this.mapper    = {
			toItem: PromiseMapper(this.toItem.bind(this)),
		};
		this.cache     = undefined;
	}

	withContainer(container: SourceInfer.Container<TSource>): this {
		this.container = container;
		return this;
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
					id: (await this.resolveId(create)).id,
					...create,
				});
			}
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async backup(entity: SourceInfer.Entity<TSource>): Promise<SourceInfer.Backup<TSource> | undefined> {
		return entity;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async restore(backup?: SourceInfer.Backup<TSource>): Promise<SourceInfer.Entity<TSource> | undefined> {
		throw new Error(`Source [${this.name}] does not support restoring backups.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async resolveId(source: SourceInfer.Create<TSource>): Promise<IWithIdentity> {
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

	hashOf(query: SourceInfer.Query<TSource>, type?: string): string {
		return crypto.createHash("sha256").update(JSON.stringify({
			query,
			type,
			userId: this.container.user.optional(),
		})).digest("hex");
	}

	async clearCache(): Promise<any> {
		this.cache?.query?.clear();
		this.cache?.count?.clear();
		await this.$clearCache();
	}

	async $clearCache(): Promise<any> {
	}

	async truncate(): Promise<void> {
		await this.$truncate();
		await this.clearCache();
	}

	async $truncate(): Promise<void> {
	}

	abstract toItem(source: SourceInfer.Entity<TSource>): Promise<SourceInfer.Item<TSource>>;
}
