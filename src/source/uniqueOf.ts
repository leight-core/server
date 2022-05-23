export interface IUniqueOfRequest {
	where: { id: string; };
	rejectOnNotFound?: boolean;
}

export type IUniqueOfCallback<TEntity> = (request: IUniqueOfRequest) => Promise<TEntity | null>;

export const uniqueOf = <TEntity>(callback: IUniqueOfCallback<TEntity>) => async (id: string): Promise<TEntity> => await callback({
	where: {id},
	rejectOnNotFound: true,
}) as TEntity;
