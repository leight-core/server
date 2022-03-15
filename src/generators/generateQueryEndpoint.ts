import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateQueryEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{
			imports: [
				'FC',
				'ConsumerProps',
			],
			from: '"react"',
		},
		{
			imports: [
				'ISourceContext',
				'IQueryParams',
				'IQueryResult',
				'IToOptionMapper',
			],
			from: '"@leight-core/api"',
		},
		{
			imports: [
				'Form',
				'IFormProps',
				'useSourceContext',
				'ISourceProviderProps',
				'createQueryHook',
				'createPromiseHook',
				'useLinkContext',
				'SourceProvider',
				'SourceContext',
				'List',
				'IListProps',
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
				'IFilterWithoutTranslationProps',
				'Filter',
				'IQuerySourceSelectProps',
			],
			from: '"@leight-core/client"',
		},
	]);

	const queryParams = `I${generatorCommons.name}QueryParams`;
	const name = generatorCommons.name;
	const request = generatorCommons.generics[0];
	const response = generatorCommons.generics[1];
	const filter = generatorCommons.generics[2] || 'void';
	const orderBy = generatorCommons.generics[3] || 'void';

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";

export type ${queryParams} = ${generatorCommons.generics[4] ?? 'void'};

export const use${name}Query = createQueryHook<${request}, IQueryResult<${response}>, ${queryParams}>(${name}ApiLink, "post");

export const use${name}Source = () => useSourceContext<${response}>()

export interface I${name}SourceContext extends ISourceContext<${response}> {
}

export interface I${name}SourceProps extends Partial<ISourceProviderProps<${response}>> {
}

export interface I${name}SourceConsumerProps extends ConsumerProps<ISourceContext<${response}>> {
}

export const ${name}SourceConsumer: FC<I${name}SourceConsumerProps> = props => {
	return <SourceContext.Consumer {...props}/>
}

export const ${name}Source: FC<I${name}SourceProps> = props => {
	return <SourceProvider<${response}>
		useQuery={use${name}Query}
		{...props}
	/>;
}

export const use${name}Link = (): ((query: ${queryParams}) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${name}ApiLink, query);
}

export const use${name}Promise = createPromiseHook<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");

export interface I${name}FilterProviderProps extends Partial<IFilterProviderProps<${filter}>> {
}

export const ${name}FilterProvider: FC<I${name}FilterProviderProps> = props => {
	return <FilterProvider<${filter}> {...props}/>
}

export const use${name}OptionalFilterContext = () => useOptionalFilterContext<${filter}>()
export const use${name}FilterContext = () => useFilterContext<${filter}>()

export interface I${name}SourceFilterProps extends IFilterWithoutTranslationProps<${filter}> {
}

export const ${name}SourceFilter: FC<I${name}SourceFilterProps> = props => {
	return <Filter
		{...props}
		translation={'common.filter.${name}'}
	/>
}

export interface I${name}OrderByProviderProps extends Partial<IOrderByProviderProps<${filter}>> {
}

export const ${name}OrderByProvider: FC<I${name}OrderByProviderProps> = props => {
	return <OrderByProvider<${filter}> {...props}/>
}

export const use${name}OptionalOrderByContext = () => useOptionalOrderByContext<${filter}>()
export const use${name}OrderByContext = () => useOrderByContext<${filter}>()

export interface I${name}ListSourceProps extends Partial<IListProps<${response}>> {
	sourceProps?: Partial<I${name}SourceProps>;
}

export interface I${name}SourceControlProviderProps extends Partial<ISourceControlProviderProps<${filter}, ${orderBy}, ${queryParams}>> {
}

export const ${name}SourceControlProvider: FC<I${name}SourceControlProviderProps> = props => {
	return <SourceControlProvider<${filter}, ${orderBy}> {...props}/>
}

export const ${name}ListSource: FC<I${name}ListSourceProps> = ({sourceProps, ...props}) => {
	return <${name}Source
		{...sourceProps}
	>
		<List<${response}>
			{...props}		
		/>
	</${name}Source>
}


export interface I${name}SourceSelectProps extends Partial<IQuerySourceSelectProps<${response}>> {
	toOption: IToOptionMapper<${response}>;
	sourceProps?: I${name}SourceProps;
}

export const ${name}SourceSelect: FC<I${name}SourceSelectProps> = ({sourceProps, ...props}) => {
	return <${name}Source defaultSize={100} {...sourceProps}>
		<QuerySourceSelect<${response}> {...props}/>
	</${name}Source>;
};
`);
}
