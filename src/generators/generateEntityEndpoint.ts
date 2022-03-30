import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateEntityEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{
			imports: [
				'FC',
			],
			from: '"react"',
		},
		{imports: ['useQueryClient'], from: '"react-query"'},
		{
			imports: [
				'IQueryFilter',
				'IQueryOrderBy',
			],
			from: '"@leight-core/api"',
		},
		{
			imports: [
				'createQueryHook',
				'createPromiseHook',
				'useLinkContext',
				'IFilterProviderProps',
				'FilterProvider',
				'useOptionalFilterContext',
				'useFilterContext',
				'IOrderByProviderProps',
				'OrderByProvider',
				'useOptionalOrderByContext',
				'useOrderByContext',
				'SourceControlProvider',
				'ISourceControlProviderProps',
			],
			from: '"@leight-core/client"',
		},
	]);

	const queryParams = `I${generatorCommons.name}QueryParams`;
	const name = generatorCommons.name;
	const request = generatorCommons.generics[0];
	const response = generatorCommons.generics[1];

	// language=text
	return cleanup(`
/**
 * Generated file; DO NOT modify as it could be overridden by a generator.
 */

${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";

export type ${queryParams} = ${generatorCommons.generics[4] ?? 'undefined'};

export const use${name}Query = createQueryHook<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");

export const use${name}Link = (): ((queryParams?: ${queryParams}) => string) => {
	const linkContext = useLinkContext();
	return queryParams => linkContext.link(${name}ApiLink, queryParams);
}

export const use${name}Promise = createPromiseHook<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");

export interface I${name}FilterProviderProps extends Partial<IFilterProviderProps<IQueryFilter<${request}>>> {
}

export const ${name}FilterProvider: FC<I${name}FilterProviderProps> = props => <FilterProvider<IQueryFilter<${request}>> {...props}/>;

export const use${name}OptionalFilterContext = () => useOptionalFilterContext<IQueryFilter<${request}>>()
export const use${name}FilterContext = () => useFilterContext<IQueryFilter<${request}>>()

export interface I${name}OrderByProviderProps extends Partial<IOrderByProviderProps<IQueryFilter<${request}>>> {
}

export const ${name}OrderByProvider: FC<I${name}OrderByProviderProps> = props => <OrderByProvider<IQueryFilter<${request}>> {...props}/>;

export const use${name}OptionalOrderByContext = () => useOptionalOrderByContext<IQueryFilter<${request}>>()
export const use${name}OrderByContext = () => useOrderByContext<IQueryFilter<${request}>>()

export interface I${name}SourceControlProviderProps extends Partial<ISourceControlProviderProps<IQueryFilter<${request}>, IQueryOrderBy<${request}>, ${queryParams}>> {
}

export const ${name}SourceControlProvider: FC<I${name}SourceControlProviderProps> = props => <SourceControlProvider<IQueryFilter<${request}>, IQueryOrderBy<${request}>> {...props}/>;

export const use${name}QueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}ApiLink]);
}
`);
}
