import {IPrismaTransaction, IPromiseMapper, IQuery, IQueryFilter, ISource} from "@leight-core/api";
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

export const Source = <TEntity, TItem, TQuery extends IQuery<any, any>, T extends ISource<TEntity, TItem, TQuery>>(
	{
		name,
		prisma,
		native,
		source,
		map,
		filter: $filter,
		...request
	}: ISourceRequest<TEntity, TItem, TQuery> & Omit<T, keyof ISource<TEntity, TItem, TQuery>>): ISource<TEntity, TItem, TQuery> & T => {
	const defaultMapper: ISource<TEntity, any, TQuery>["mapper"] = {
		map,
		list: async source => Promise.all((await source).map(map)),
	};
	let $prisma = prisma;
	let $mapper = defaultMapper;
	let $user = User();

	const $ofPrisma = ofPrisma(native);

	const $source: ISource<TEntity, any, TQuery> = {
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
		filter: filter => merge<IQueryFilter<TQuery>, IQueryFilter<TQuery>>(filter || {}, $filter?.(filter) || filter || {}),
		withDefaultMapper: () => {
			$mapper = defaultMapper;
			return $source;
		},
		withMapper: <T>(mapper: IPromiseMapper<TEntity, T>): ISource<TEntity, T, TQuery> => {
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

	return $source as ISource<TEntity, TItem, TQuery> & T;
};
