import {
	IEndpoint,
	IEndpointCallback,
	IEntityEndpoint,
	IGetEndpoint,
	IListEndpoint,
	IMutationEndpoint,
	IQuery,
	IQueryParams,
	IRequestEndpoint,
	ISource,
	ISourceCreate,
	ISourceItem,
	ISourcePatch,
	ISourceQuery,
	IWithIdentity
} from "@leight-core/api";
import {IEndpointParams} from "@leight-core/api/lib/cjs/endpoint/interface";
import {Logger, User, withMetrics} from "@leight-core/server";
import {isCallable} from "@leight-core/utils";
import {getToken} from "next-auth/jwt";
import getRawBody from "raw-body";

export const Endpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	const logger = Logger("endpoint");
	return withMetrics(async (req, res) => {
		const token = await getToken({req});
		const timer = logger.startTimer();
		const labels = {url: req.url, userId: token?.sub};
		logger.debug("Endpoint Call", {labels, url: req.url, body: req.body});
		try {
			const run = async () => await handler({
				req,
				res,
				request: req.body,
				query: req.query,
				toBody: () => getRawBody(req),
				end: res.end,
				user: User(token?.sub),
			});
			const response = await run();
			logger.debug("Endpoint Call Response", {labels, url: req.url});
			response !== undefined && res.status(200).json(response);
		} catch (e) {
			console.log(e);
			logger.error("Endpoint Exception", {labels, url: req.url, body: req.body});
			if (e instanceof Error) {
				logger.error(e.message, {labels, url: req.url, body: req.body});
				e.stack && logger.error(e.stack, {labels, url: req.url, body: req.body});
				if (e.message.includes("Unknown user; missing token.")) {
					res.status(403).end("Nope.");
					return;
				}
			}
			res.status(500).end("A request failed with Internal Server Error.");
		} finally {
			timer.done({
				level: "debug",
				message: "Endpoint Call Done",
				labels,
				url: req.url,
			});
		}
	});
};

export const ListEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IListEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => Endpoint(handler);

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IMutationEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);

export const GetEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IGetEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => Endpoint(handler);

export const FetchEndpoint = <TName extends string, TSource extends ISource<any, any, any>>(
	source: TSource,
): IEndpointCallback<TName, undefined, ISourceItem<TSource>, IWithIdentity> => {
	return Endpoint(async ({user, query: {id}}) => {
		source.withUser(user);
		return source.mapper.map(await source.get(id));
	});
};

export const CreateEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams | undefined = undefined>(
	source: TSource,
): IEndpointCallback<TName, ISourceCreate<TSource>, ISourceItem<TSource>, TQueryParams> => {
	return Endpoint(async ({request, user}) => {
		source.withUser(user);
		return source.mapper.map(await source.create(request));
	});
};

export const PatchEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams | undefined = undefined>(
	source: TSource,
): IEndpointCallback<TName, ISourcePatch<TSource>, ISourceItem<TSource>, TQueryParams> => {
	return Endpoint(async ({request, user}) => {
		source.withUser(user);
		return source.mapper.map(await source.patch(request));
	});
};

export const CountEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams | undefined = undefined>(
	source: TSource | ((params: IEndpointParams<ISourceQuery<TSource>, number, TQueryParams>) => TSource),
): IEndpointCallback<TName, ISourceQuery<TSource>, number, TQueryParams> => {
	return Endpoint(async params => {
		const $source = (isCallable(source) ? (source as (params: any) => TSource)(params) : source) as TSource;
		$source.withUser(params.user);
		return $source.count(params.request);
	});
};

export const QueryEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams | undefined = undefined>(
	source: TSource | ((params: IEndpointParams<ISourceQuery<TSource>, number, TQueryParams>) => TSource),
): IEndpointCallback<TName, ISourceQuery<TSource>, ISourceItem<TSource>[], TQueryParams> => {
	return Endpoint(async params => {
		const $source = (isCallable(source) ? (source as (params: any) => TSource)(params) : source) as TSource;
		$source.withUser(params.user);
		return $source.mapper.list($source.query(params.request));
	});
};

export const EntityEndpoint = <TName extends string, TRequest extends IQuery, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IEntityEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);

export const DeleteEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams | undefined = undefined>(
	source: TSource,
): IEndpointCallback<TName, string[], ISourceItem<TSource>[], TQueryParams> => {
	return Endpoint(async ({request, user}) => {
		source.withUser(user);
		return source.delete(request);
	});
};

export const RequestEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IRequestEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);
