import {IPrismaTransaction, IPromiseMapper, IQuery, IQueryFilter, ISource, ISourceEntity, ISourceItem, ISourceQuery} from "@leight-core/api";
import {IOfPrismaRequest, ofPrisma, User} from "@leight-core/server";
import {merge} from "@leight-core/utils";

export interface ISourceRequest<TEntity, TItem, TQuery extends IQuery<any, any>> {
	name: string;
	prisma: IPrismaTransaction;
	native: IOfPrismaRequest<TQuery, TEntity>;
	source?: Partial<ISource<TEntity, TItem, TQuery>>;

	filter?(filter: IQueryFilter<TQuery>): IQueryFilter<TQuery>;

	map(source: TEntity): Promise<TItem>;
}

export const Source = <T extends ISource<any, any, IQuery<any, any>>>(
	{
		name,
		prisma,
		native,
		source,
		map,
		filter: $filter,
		...request
	}: ISourceRequest<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>> & Omit<T, keyof ISource<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>>>): ISource<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>> & T => {
	const defaultMapper: ISource<ISourceEntity<T>, any, ISourceQuery<T>>["mapper"] = {
		map,
		list: async source => Promise.all((await source).map(map)),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $ofPrisma = ofPrisma(native);

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
				return await $ofPrisma.find(query);
			} catch (e) {
				console.warn(e);
				return null;
			}
		},
		filter: filter => merge<IQueryFilter<ISourceQuery<T>>, IQueryFilter<ISourceQuery<T>>>(filter || {}, $filter?.(filter) || filter || {}),
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
		...$ofPrisma,
		...source,
		...request,
	};

	return $source as ISource<ISourceEntity<T>, ISourceItem<T>, ISourceQuery<T>> & T;
};
