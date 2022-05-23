import {
	IDeleteEndpoint,
	IDeleteRequest,
	IEndpoint,
	IEndpointCallback,
	IEntityEndpoint,
	IFetchEndpoint,
	IListEndpoint,
	IMutationEndpoint,
	IQuery,
	IQueryParams,
	IRepository,
	IRepositoryItem,
	IRepositoryQuery,
	IRequestEndpoint,
	ISource,
	ISourceItem,
	ISourceQuery
} from "@leight-core/api";
import {Logger, User, withMetrics} from "@leight-core/server";
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
				level: "debug",
				message: "Endpoint Call Done",
				labels,
				url: req.url,
			});
		}
	});
};

export const FetchEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IFetchEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => {
	return Endpoint<TName, undefined, TResponse, TQueryParams>(handler);
};

export const ListEndpoint = <TName extends string, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IListEndpoint<TName, TResponse, TQueryParams>,
): IEndpointCallback<TName, undefined, TResponse, TQueryParams> => {
	return Endpoint<TName, undefined, TResponse, TQueryParams>(handler);
};

export const MutationEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IMutationEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const CreateEndpoint = <TName extends string, TRepository extends IRepository<any, ISource<any, any, IQuery<any, any>>>>(
	repository: TRepository,
): IEndpointCallback<TName, IRepositoryQuery<TRepository>, IRepositoryItem<TRepository>> => {
	return Endpoint<TName, IRepositoryQuery<TRepository>, IRepositoryItem<TRepository>>(async ({request, user}) => {
		repository.source.withUser(user);
		return repository.source.mapper.map(repository.create(request));
	});
};

export const QueryEndpoint = <TName extends string, TSource extends ISource<any, any, IQuery<any, any>>>(
	source: TSource,
): IEndpointCallback<TName, ISourceQuery<TSource>, ISourceItem<TSource>[]> => {
	return Endpoint<TName, ISourceQuery<TSource>, ISourceItem<TSource>[]>(async ({request, user}) => {
		source.withUser(user);
		return source.mapper.list(source.query(request));
	});
};

export const EntityEndpoint = <TName extends string, TRequest extends IQuery<any, any>, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IEntityEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const DeleteEndpoint = <TName extends string, TRequest extends IDeleteRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IDeleteEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};

export const RequestEndpoint = <TName extends string, TRequest, TResponse, TQueryParams extends IQueryParams | undefined = undefined>(
	handler: IRequestEndpoint<TName, TRequest, TResponse, TQueryParams>,
): IEndpointCallback<TName, TRequest, TResponse, TQueryParams> => {
	return Endpoint<TName, TRequest, TResponse, TQueryParams>(handler);
};
