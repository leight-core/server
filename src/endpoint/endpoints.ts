import {ICreateEndpoint, IDeleteEndpoint, IEndpoint, IEndpointCallback, IFetchEndpoint, IListEndpoint, IMutationEndpoint, IPatchEndpoint, IQueryEndpoint, IQueryParams, IQueryResult} from "@leight-core/api";
import getRawBody from "raw-body";

export const Endpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams = void>(handler: IEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return async (req, res) => {
		try {
			return await handler({
				req,
				res,
				toBody: () => getRawBody(req),
			});
		} catch (e) {
			console.error('Endpoint error', e);
			res.status(500).send('A request failed with Internal Server Error.' as any);
		}
	};
}

export const FetchEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams = void>(handler: IFetchEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}

export const ListEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams = void>(handler: IListEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams = void>(handler: IMutationEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const CreateEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams = void>(handler: ICreateEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const PatchEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams = void>(handler: IPatchEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const QueryEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams = void>(handler: IQueryEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, IQueryResult<TResponse>, TQuery> => {
	return Endpoint<TName, TRequest, IQueryResult<TResponse>, TQuery>(handler);
}

export const DeleteEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams = void>(handler: IDeleteEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}
