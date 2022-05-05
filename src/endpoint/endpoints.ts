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
import {Logger, withMetrics} from "@leight-core/server";
import LRUCache from "lru-cache";
import {getToken} from "next-auth/jwt";
import getRawBody from "raw-body";

export const Endpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IEndpoint<TName, TRequest, TResponse, TQueryParams>,
	cache?: LRUCache<string, any>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	const logger = Logger("endpoint");
	return withMetrics(async (req, res) => {
		const token = await getToken({req});
		const timer = logger.startTimer();
		const labels = {url: req.url, userId: token?.sub};
		logger.info("Endpoint Call", {labels, url: req.url, body: req.body});
		try {
			const run = async () => await handler({
				req,
				res,
				request: req.body,
				query: req.query,
				toBody: () => getRawBody(req),
				end: res.end,
				toUserId: () => {
					if (!token?.sub) {
						throw new Error("Unknown user; missing token.");
					}
					return token.sub;
				},
				toMaybeUserId: () => token?.sub,
			});
			const key = cache ? `${req.url}-${token?.sub}-${JSON.stringify(req.body)}-${JSON.stringify(req.query)}` : "null";
			if (cache && !cache.has(key)) {
				cache.set(key, await run());
			}
			const response = (cache && cache.get(key)) || await run();
			logger.debug("Endpoint Call Response", {labels, url: req.url, response});
			response !== undefined && res.status(200).json(response);
		} catch (e) {
			logger.error("Endpoint Exception", {labels, url: req.url, body: req.body});
			if (e instanceof Error) {
				logger.error(e.message, {labels, url: req.url, body: req.body});
				if (e.message.includes("Unknown user; missing token.")) {
					res.status(403).end("Nope.");
				}
				return;
			}
			res.status(500).end("A request failed with Internal Server Error.");
		} finally {
			timer.done({
				message: "Endpoint Call Done",
				labels,
				url: req.url,
			});
		}
	});
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
