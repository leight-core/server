import {
	AclError,
	ClientError,
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
	IWithIdentityQuery
} from "@leight-core/api";
import {IEndpointParams} from "@leight-core/api/lib/cjs/endpoint/interface";
import {Logger, User, withMetrics} from "@leight-core/server";
import {getToken} from "next-auth/jwt";
import getRawBody from "raw-body";

export interface IEndpointSource<TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any> {
	source(params: IEndpointParams<ISourceQuery<TSource>, number, TQueryParams>): TSource;

	acl?: string[];
}

const withSource = <TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>({source}: IEndpointSource<TSource, TQueryParams>, params: IEndpointParams<any, any, TQueryParams>) => {
	return source(params).withUser(params.user);
};

export const Endpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams = any>(
	{handler, acl}: IEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	const logger = Logger("endpoint");
	return withMetrics(async (req, res) => {
		const token = await getToken({req});
		const timer = logger.startTimer();
		const labels = {url: req.url, userId: token?.sub};
		logger.debug("Endpoint Call", {labels, url: req.url, body: req.body});
		try {
			const user = User({
				userId: token?.sub,
				tokens: (token as any)?.tokens,
			});
			user.checkAny(acl);
			const run = async () => await handler({
				req,
				res,
				request: req.body,
				query: req.query,
				toBody: () => getRawBody(req),
				end: res.end,
				user,
			});
			const response = await run();
			logger.debug("Endpoint Call Response", {labels, url: req.url});
			response !== undefined && res.status(200).json(response);
		} catch (e) {
			console.log(e);
			if (e instanceof AclError) {
				console.log("ACL Exception: Tokens", e.tokens, "Requested tokens", e.requested);
				res.status(e.code).end(e.message);
				return;
			} else if (e instanceof ClientError) {
				res.status(e.code).end(e.message);
				return;
			}
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

export const ListEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams = any>(
	handler: IListEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => Endpoint(handler);

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams = any>(
	handler: IMutationEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);

export const GetEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams = any>(
	handler: IGetEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => Endpoint(handler);

export const FetchEndpoint = <TName extends string, TSource extends ISource<any, any, any>>(
	source: IEndpointSource<TSource>,
): IEndpointCallback<TName, undefined, ISourceItem<TSource>, IWithIdentityQuery> => {
	return Endpoint({
		handler: async params => {
			const $source = withSource(source, params);
			return $source.mapper.map(await $source.get(params.query.id));
		},
		acl: source.acl,
	});
};

export const CreateEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>(
	source: IEndpointSource<TSource, TQueryParams>,
): IEndpointCallback<TName, ISourceCreate<TSource>, ISourceItem<TSource>, TQueryParams> => {
	return Endpoint({
		handler: async params => {
			const $source = withSource(source, params);
			return $source.mapper.map(await $source.create(params.request));
		},
		acl: source.acl,
	});
};

export const PatchEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>(
	source: IEndpointSource<TSource, TQueryParams>,
): IEndpointCallback<TName, ISourcePatch<TSource>, ISourceItem<TSource>, TQueryParams> => {
	return Endpoint({
		handler: async params => {
			const $source = withSource(source, params);
			return $source.mapper.map(await $source.patch(params.request));
		},
		acl: source.acl,
	});
};

export const CountEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>(
	source: IEndpointSource<TSource, TQueryParams>,
): IEndpointCallback<TName, ISourceQuery<TSource>, number, TQueryParams> => {
	return Endpoint({
		handler: async params => withSource(source, params).count(params.request),
		acl: source.acl,
	});
};

export const QueryEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>(
	source: IEndpointSource<TSource, TQueryParams>,
): IEndpointCallback<TName, ISourceQuery<TSource>, ISourceItem<TSource>[], TQueryParams> => {
	return Endpoint({
		handler: async params => {
			const $source = withSource(source, params);
			return $source.mapper.list($source.query(params.request));
		},
		acl: source.acl,
	});
};

export const EntityEndpoint = <TName extends string, TRequest extends IQuery, TResponse, TQueryParams extends IQueryParams = any>(
	handler: IEntityEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);

export const DeleteEndpoint = <TName extends string, TSource extends ISource<any, any, any>, TQueryParams extends IQueryParams = any>(
	source: IEndpointSource<TSource, TQueryParams>,
): IEndpointCallback<TName, string[], ISourceItem<TSource>[], TQueryParams> => {
	return Endpoint({
		handler: async params => withSource(source, params).delete(params.request),
		acl: source.acl,
	});
};

export const RequestEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams = any>(
	handler: IRequestEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => Endpoint(handler);
