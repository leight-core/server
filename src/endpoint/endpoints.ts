import {ICreateEndpoint, IDeleteEndpoint, IEndpoint, IEndpointCallback, IFetchEndpoint, IListEndpoint, IMutationEndpoint, IPatchEndpoint, IQuery, IQueryEndpoint, IQueryParams, IQueryResult} from "@leight-core/api";
import getRawBody from "raw-body";

export const Endpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams | void = void>(handler: IEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return async (req, res) => {
		try {
			const response = await handler({
				req,
				res,
				request: req.body,
				query: req.query,
				toBody: () => getRawBody(req),
			});
			response && res.status(200).json(response);
		} catch (e) {
			console.error('Endpoint error', e);
			res.status(500).send('A request failed with Internal Server Error.' as any);
		}
	};
}

export const FetchEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams | void = void>(handler: IFetchEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}

export const ListEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams | void = void>(handler: IListEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams | void = void>(handler: IMutationEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const CreateEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams | void = void>(handler: ICreateEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const PatchEndpoint = <TName extends string, TRequest, TResponse, TQuery extends IQueryParams | void = void>(handler: IPatchEndpoint<TName, TRequest, TResponse, TQuery>): IEndpointCallback<TName, TRequest, TResponse, TQuery> => {
	return Endpoint<TName, TRequest, TResponse, TQuery>(handler);
}

export const QueryEndpoint = <TName extends string, TRequest extends IQuery<TFilter, TOrderBy> | void, TResponse, TFilter = void, TOrderBy = void, TQuery extends IQueryParams | void = void>(handler: IQueryEndpoint<TName, TRequest, TResponse, TFilter, TOrderBy, TQuery>): IEndpointCallback<TName, TRequest, IQueryResult<TResponse>, TQuery> => {
	return Endpoint<TName, TRequest, IQueryResult<TResponse>, TQuery>(handler);
}

export const DeleteEndpoint = <TName extends string, TResponse, TQuery extends IQueryParams | void = void>(handler: IDeleteEndpoint<TName, TResponse, TQuery>): IEndpointCallback<TName, void, TResponse, TQuery> => {
	return Endpoint<TName, void, TResponse, TQuery>(handler);
}
