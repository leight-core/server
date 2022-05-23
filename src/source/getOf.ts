export interface IGetOfRequest {
	where: { id: string; };
	rejectOnNotFound?: boolean;
}

export type IGetOfCallback<TEntity> = (getOf: IGetOfRequest) => Promise<TEntity>;

export const getOf = <TEntity>(getOfCallback: IGetOfCallback<TEntity>) => async (id: string): Promise<TEntity> => getOfCallback({
	where: {id},
	rejectOnNotFound: true,
});
