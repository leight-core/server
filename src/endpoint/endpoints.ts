import {
	ICreateEndpoint,
	IDeleteEndpoint,
	IEndpoint,
	IEndpointCallback,
	IEntityEndpoint,
	IFetchEndpoint,
	IListEndpoint,
	IMutationEndpoint,
	IPatchEndpoint,
	IQuery,
	IQueryEndpoint,
	IQueryParams,
	IQueryResult,
	IRequestEndpoint
} from "@leight-core/api";
import {getToken} from "next-auth/jwt";
import getRawBody from "raw-body";
import winston from "winston";

export const Endpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	const logger = winston.loggers.get("endpoint");
	return async (req, res) => {
		const timer = logger.startTimer();
		const meta = {url: req.url, body: req.body};
		logger.info("Endpoint Call", meta);
		try {
			const response = await handler({
				req,
				res,
				request: req.body,
				query: req.query,
				toBody: () => getRawBody(req),
				end: res.end,
				toUserId: async () => {
					const token: any = await getToken({req});
					if (!token) {
						throw new Error("Unknown user; missing token.");
					}
					return token.sub;
				}
			});
			logger.debug("Endpoint Call Response", {...meta, response});
			response !== undefined && res.status(200).json(response);
		} catch (e) {
			logger.error(`Endpoint Exception`, {...meta, error: e});
			if ((e as Error)?.message?.includes("Unknown user; missing token.")) {
				res.status(403).send("Nope." as any);
				return;
			}
			res.status(500).send("A request failed with Internal Server Error." as any);
		} finally {
			timer.done({
				message: "Endpoint Call Done",
				labels: meta,
			});
		}
	};
};

export const FetchEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IFetchEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => {
	return Endpoint<TName, undefined, TResponse, TQueryParams>(handler);
};

export const ListEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IListEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => {
	return Endpoint<TName, undefined, TResponse, TQueryParams>(handler);
};

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IMutationEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const CreateEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: ICreateEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const PatchEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IPatchEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const QueryEndpoint = <TName extends string, TRequest extends IQuery<any, any>, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IQueryEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, IQueryResult<TResponse>, TQueryParams> => {
	return Endpoint<TName, TRequest, IQueryResult<TResponse>, TQueryParams>(handler);
};

export const EntityEndpoint = <TName extends string, TRequest extends IQuery<any, any>, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IEntityEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const DeleteEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IDeleteEndpoint<TName, TResponse, TQueryParams>): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => {
	return Endpoint<TName, undefined, TResponse, TQueryParams>(handler);
};

export const RequestEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(handler: IRequestEndpoint<TName, TRequest, TResponse, TQueryParams>): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};
