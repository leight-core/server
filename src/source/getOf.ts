export interface IGetOfRequest {
	where: { id: string; };
	rejectOnNotFound?: boolean;
}

export type IGetOfCallback<TEntity> = (getOf: IGetOfRequest) => Promise<TEntity | null>;

export const getOf = <TEntity>(getOfCallback: IGetOfCallback<TEntity>) => async (id: string): Promise<TEntity> => await getOfCallback({
	where: {id},
	rejectOnNotFound: true,
}) as TEntity;
