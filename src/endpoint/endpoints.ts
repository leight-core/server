import {ICreateEndpoint, IDeleteEndpoint, IEndpoint, IEndpointCallback, IFetchEndpoint, IListEndpoint, IMutationEndpoint, IPatchEndpoint, IQuery, IQueryEndpoint, IQueryParams, IQueryResult} from "@leight-core/api";
import getRawBody from "raw-body";

export const Endpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
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

export const FetchEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IFetchEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, void, TResponse, TQueryParams> => {
	return Endpoint<TName, void, TResponse, TQueryParams>(handler);
}

export const ListEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IListEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, void, TResponse, TQueryParams> => {
	return Endpoint<TName, void, TResponse, TQueryParams>(handler);
}

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IMutationEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
}

export const CreateEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: ICreateEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
}

export const PatchEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IPatchEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
}

export const QueryEndpoint = <TName extends string, TRequest extends IQuery<TFilter, TOrderBy> | undefined, TResponse, TFilter = void, TOrderBy = void, TQueryParams extends IQueryParams | undefined = undefined>(handler: IQueryEndpoint<TName, TRequest, TResponse, TFilter, TOrderBy, TQueryParams>): IEndpointCallback<TName, TRequest, IQueryResult<TResponse>, TQueryParams> => {
	return Endpoint<TName, TRequest, IQueryResult<TResponse>, TQueryParams>(handler);
}

export const DeleteEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IDeleteEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, void, TResponse, TQueryParams> => {
	return Endpoint<TName, void, TResponse, TQueryParams>(handler);
}
