import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateQueryEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	const queryParams = `I${generatorCommons.name}QueryParams`;

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
			],
			from: '"@leight-core/client"',
		},
	]);

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${generatorCommons.name}ApiLink = "${generatorCommons.api}";

export type ${queryParams} = ${generatorCommons.generics[4] ?? 'void'};

export const use${generatorCommons.name}Query = createQueryHook<${generatorCommons.generics[0]}, IQueryResult<${generatorCommons.generics[1]}>, ${queryParams}>(${generatorCommons.name}ApiLink, "post");

export const use${generatorCommons.name}Source = () => useSourceContext<${generatorCommons.generics[1]}>()

export interface I${generatorCommons.name}SourceContext extends ISourceContext<${generatorCommons.generics[1]}> {
}

export interface I${generatorCommons.name}SourceProps extends Partial<ISourceProviderProps<${generatorCommons.generics[1]}>> {
}

export interface I${generatorCommons.name}SourceConsumerProps extends ConsumerProps<ISourceContext<${generatorCommons.generics[1]}>> {
}

export const ${generatorCommons.name}SourceConsumer: FC<I${generatorCommons.name}SourceConsumerProps> = props => {
	return <SourceContext.Consumer {...props}/>
}

export const ${generatorCommons.name}Source: FC<I${generatorCommons.name}SourceProps> = props => {
	return <SourceProvider<${generatorCommons.generics[1]}>
		useQuery={use${generatorCommons.name}Query}
		{...props}
	/>;
}

export const use${generatorCommons.name}Link = (): ((query: ${queryParams}) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${generatorCommons.name}ApiLink, query);
}

export const use${generatorCommons.name}Promise = createPromiseHook<${generatorCommons.generics[0]}, ${generatorCommons.generics[1]}, ${queryParams}>(${generatorCommons.name}ApiLink, "post");

export interface I${generatorCommons.name}FilterProviderProps extends Partial<IFilterProviderProps<${generatorCommons.generics[2] || 'void'}>> {
}

export const ${generatorCommons.name}FilterProvider: FC<I${generatorCommons.name}FilterProviderProps> = props => {
	return <FilterProvider<${generatorCommons.generics[2] || 'void'}> {...props}/>
}

export const use${generatorCommons.name}OptionalFilterContext = () => useOptionalFilterContext<${generatorCommons.generics[2] || 'void'}>()
export const use${generatorCommons.name}FilterContext = () => useFilterContext<${generatorCommons.generics[2] || 'void'}>()

export interface I${generatorCommons.name}SourceFilterProps extends IFilterWithoutTranslationProps<${generatorCommons.generics[2] || 'void'}> {
}

export const ${generatorCommons.name}SourceFilter: FC<I${generatorCommons.name}SourceFilterProps> = props => {
	return <Filter
		{...props}
		translation={'common.filter.${generatorCommons.name}'}
	/>
}

export interface I${generatorCommons.name}OrderByProviderProps extends Partial<IOrderByProviderProps<${generatorCommons.generics[2] || 'void'}>> {
}

export const ${generatorCommons.name}OrderByProvider: FC<I${generatorCommons.name}OrderByProviderProps> = props => {
	return <OrderByProvider<${generatorCommons.generics[2] || 'void'}> {...props}/>
}

export const use${generatorCommons.name}OptionalOrderByContext = () => useOptionalOrderByContext<${generatorCommons.generics[2] || 'void'}>()
export const use${generatorCommons.name}OrderByContext = () => useOrderByContext<${generatorCommons.generics[2] || 'void'}>()

export interface I${generatorCommons.name}ListSourceProps extends Partial<IListProps<${generatorCommons.generics[1]}>> {
	sourceProps?: Partial<I${generatorCommons.name}SourceProps>;
}

export interface I${generatorCommons.name}SourceControlProviderProps extends Partial<ISourceControlProviderProps<${generatorCommons.generics[2] || 'void'}, ${generatorCommons.generics[3] || 'void'}, ${queryParams}>> {
}

export const ${generatorCommons.name}SourceControlProvider: FC<I${generatorCommons.name}SourceControlProviderProps> = props => {
	return <SourceControlProvider<${generatorCommons.generics[2] || 'void'}, ${generatorCommons.generics[3] || 'void'}> {...props}/>
}

export const ${generatorCommons.name}ListSource: FC<I${generatorCommons.name}ListSourceProps> = ({sourceProps, ...props}) => {
	return <${generatorCommons.name}Source
		{...sourceProps}
	>
		<List<${generatorCommons.generics[1]}>
			{...props}		
		/>
	</${generatorCommons.name}Source>
}
`);
}
