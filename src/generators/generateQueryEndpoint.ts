import {ISdk} from "@leight-core/api";
import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";

export function generateQueryEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{
			imports: [
				"FC",
				"ConsumerProps",
			],
			from: "\"react\"",
		},
		{imports: ["useQueryClient"], from: "\"react-query\""},
		{
			imports: [
				"ISourceContext",
				"IQueryParams",
				"IQueryResult",
				"IToOptionMapper",
				"IQueryFilter",
				"IQueryOrderBy",
			],
			from: "\"@leight-core/api\"",
		},
		{
			imports: [
				"Form",
				"IFormProps",
				"useSourceContext",
				"ISourceProviderProps",
				"createQueryHook",
				"createPromiseHook",
				"createPromise",
				"toLink",
				"SourceProvider",
				"SourceContext",
				"List",
				"IListProps",
				"IFilterProviderProps",
				"FilterProvider",
				"useOptionalFilterContext",
				"useFilterContext",
				"IOrderByProviderProps",
				"OrderByProvider",
				"useOptionalOrderByContext",
				"useOrderByContext",
				"SourceControlProvider",
				"ISourceControlProviderProps",
				"IFilterWithoutTranslationProps",
				"Filter",
				"IQuerySourceSelectProps",
				"QuerySourceSelect",
			],
			from: "\"@leight-core/client\"",
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

export type ${queryParams} = ${generatorCommons.generics[4] ?? "undefined"};

export const use${name}Query = createQueryHook<${request}, IQueryResult<${response}>, ${queryParams}>(${name}ApiLink, "post");

export const use${name}Source = () => useSourceContext<${response}>()

export interface I${name}SourceContext extends ISourceContext<${response}> {
}

export interface I${name}SourceConsumerProps extends ConsumerProps<ISourceContext<${response}>> {
}

export const ${name}SourceConsumer: FC<I${name}SourceConsumerProps> = props => <SourceContext.Consumer {...props}/>;

export interface I${name}SourceProps extends Partial<ISourceProviderProps<${response}>> {
}

export const ${name}Source: FC<I${name}SourceProps> = props => {
	return <SourceProvider<${response}>
		name={"${name}"}
		useQuery={use${name}Query}
		{...props}
	/>;
}

export const to${name}Link = (queryParams?: ${queryParams}) => toLink(${name}ApiLink, queryParams);
export const use${name}Link = () => to${name}Link;

export const use${name}Promise = createPromiseHook<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");
export const ${name}Promise = createPromise<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");

export interface I${name}FilterProviderProps extends Partial<IFilterProviderProps<IQueryFilter<${request}>>> {
}

export const ${name}FilterProvider: FC<I${name}FilterProviderProps> = props => <FilterProvider<IQueryFilter<${request}>> name={"${name}"} {...props}/>;

export const use${name}OptionalFilterContext = () => useOptionalFilterContext<IQueryFilter<${request}>>()
export const use${name}FilterContext = () => useFilterContext<IQueryFilter<${request}>>()

export interface I${name}SourceFilterProps extends IFilterWithoutTranslationProps<IQueryFilter<${request}>> {
}

export const ${name}SourceFilter: FC<I${name}SourceFilterProps> = props => <Filter
	{...props}
	translation={'common.filter.${name}'}
/>;

export interface I${name}OrderByProviderProps extends Partial<IOrderByProviderProps<IQueryOrderBy<${request}>>> {
}

export const ${name}OrderByProvider: FC<I${name}OrderByProviderProps> = props => <OrderByProvider<IQueryOrderBy<${request}>> name={"${name}"} {...props}/>;

export const use${name}OptionalOrderByContext = () => useOptionalOrderByContext<IQueryOrderBy<${request}>>()
export const use${name}OrderByContext = () => useOrderByContext<IQueryOrderBy<${request}>>()

export interface I${name}ListSourceProps extends Partial<IListProps<${response}>> {
	sourceProps?: Partial<I${name}SourceProps>;
}

export interface I${name}SourceControlProviderProps extends Partial<ISourceControlProviderProps<IQueryFilter<${request}>, IQueryOrderBy<${request}>, ${queryParams}>> {
}

export const ${name}SourceControlProvider: FC<I${name}SourceControlProviderProps> = props => <SourceControlProvider<IQueryFilter<${request}>, IQueryOrderBy<${request}>> name={"${name}"} {...props}/>;

export const ${name}ListSource: FC<I${name}ListSourceProps> = ({sourceProps, ...props}) => {
	return <${name}Source
		{...sourceProps}
	>
		<List<${response}>
			{...props}		
		/>
	</${name}Source>
}

export interface I${name}SourceSelectProps extends IQuerySourceSelectProps<${response}> {
	toOption: IToOptionMapper<${response}>;
	sourceProps?: I${name}SourceProps;
}

export const ${name}SourceSelect: FC<I${name}SourceSelectProps> = ({sourceProps, ...props}) => {
	return <${name}Source {...sourceProps}>
		<QuerySourceSelect<${response}> {...props}/>
	</${name}Source>;
};

export const use${name}QueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}ApiLink]);
}
`);
}
