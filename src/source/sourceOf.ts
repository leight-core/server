import {IQuery, ISource, ISourceRequest, ISourceResponse} from "@leight-core/api";

export const sourceOf = async <TSource extends ISource<any, any, any, IQuery<any, any>>, TRequest extends keyof ISourceRequest<TSource>>(source: TSource, request: TRequest, arg: ISourceRequest<TSource>[TRequest]): Promise<ISourceResponse<TSource>[TRequest]> => {
	return await source[request](arg);
};
