export interface IGetOfRequest {
	where: { id: string; };
	rejectOnNotFound?: boolean;
}

export interface IGetOfCallback<TEntity> {
	findUnique(getOf: IGetOfRequest): Promise<TEntity>;
}

export const getOf = <TEntity>(getOfCallback: IGetOfCallback<TEntity>) => async (id: string): Promise<TEntity> => getOfCallback.findUnique({
	where: {id},
	rejectOnNotFound: true,
});
