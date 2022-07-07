import {ISdk} from "@leight-core/api";
import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";

export function generateQueryEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{
			imports: [
				"FC",
				"ConsumerProps",
				"ReactNode",
			],
			from: "\"react\"",
		},
		{
			imports: [
				"Col",
				"Input",
				"Row",
			],
			from: "\"antd\"",
		},
		{
			imports: [
				"SelectOutlined",
			],
			from: "\"@ant-design/icons\"",
		},
		{imports: ["useQueryClient"], from: "\"react-query\""},
		{
			imports: [
				"ISourceContext",
				"IToOptionMapper",
				"IQueryFilter",
				"IQueryOrderBy",
				"ISourceQuery",
				"ISourceItem",
			],
			from: "\"@leight-core/api\"",
		},
		{
			imports: [
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
				"InfiniteList",
				"IInfiniteListProps",
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
				"DrawerButton",
				"SelectionProvider",
				"ISelectionProviderProps",
				"useOptionalSelectionContext",
				"useSelectionContext",
			],
			from: "\"@leight-core/client\"",
		},
	]);

	const queryParams = `I${generatorCommons.name}QueryParams`;
	const name = generatorCommons.name;
	const source = generatorCommons.generics[0];
	const request = `ISourceQuery<${source}>`;
	const response = `ISourceItem<${source}>`;

	// language=text
	return cleanup(`
/**
 * Generated file; DO NOT modify as it could be overridden by a generator.
 */

${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";
export const ${name}CountApiLink = "${generatorCommons.api}/count";

export type ${queryParams} = ${generatorCommons.generics[2] ?? "any"};

export const use${name}Query = createQueryHook<${request}, ${response}[], ${queryParams}>(${name}ApiLink, "post");
export const use${name}CountQuery = createQueryHook<${request}, number, ${queryParams}>(${name}CountApiLink, "post");

export const use${name}Source = () => useSourceContext<${response}>()

export interface I${name}SourceContext extends ISourceContext<${response}> {
}

export interface I${name}SourceConsumerProps extends ConsumerProps<ISourceContext<${response}>> {
}

export const ${name}SourceConsumer: FC<I${name}SourceConsumerProps> = props => <SourceContext.Consumer {...props}/>;

export interface I${name}ProviderProps extends Partial<ISourceProviderProps<${response}>> {
}

export const ${name}Provider: FC<I${name}ProviderProps> = props => {
	return <SourceProvider<${response}>
		name={"${name}"}
		useQuery={use${name}Query}
		useCountQuery={use${name}CountQuery}
		{...props}
	/>;
};

export const to${name}Link = (queryParams?: ${queryParams}) => toLink(${name}ApiLink, queryParams);
export const use${name}Link = () => to${name}Link;

export const use${name}Promise = createPromiseHook<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");
export const ${name}Promise = createPromise<${request}, ${response}, ${queryParams}>(${name}ApiLink, "post");

export interface I${name}FilterProviderProps extends Partial<IFilterProviderProps<IQueryFilter<${request}>>> {
}

export const ${name}FilterProvider: FC<I${name}FilterProviderProps> = props => <FilterProvider<IQueryFilter<${request}>> name={"${name}"} {...props}/>;

export const use${name}OptionalFilterContext = () => useOptionalFilterContext<IQueryFilter<${request}>>()
export const use${name}FilterContext = () => useFilterContext<IQueryFilter<${request}>>()

export interface I${name}ProviderFilterProps extends IFilterWithoutTranslationProps<IQueryFilter<${request}>> {
}

export const ${name}ProviderFilter: FC<I${name}ProviderFilterProps> = props => <Filter
	{...props}
	translation={'common.filter.${name}'}
/>;

export interface I${name}OrderByProviderProps extends Partial<IOrderByProviderProps<IQueryOrderBy<${request}>>> {
}

export const ${name}OrderByProvider: FC<I${name}OrderByProviderProps> = props => <OrderByProvider<IQueryOrderBy<${request}>> name={"${name}"} {...props}/>;

export const use${name}OptionalOrderByContext = () => useOptionalOrderByContext<IQueryOrderBy<${request}>>()
export const use${name}OrderByContext = () => useOrderByContext<IQueryOrderBy<${request}>>()

export interface I${name}ProviderControlProps extends Partial<ISourceControlProviderProps<IQueryFilter<${request}>, IQueryOrderBy<${request}>, ${queryParams}>> {
}

export const ${name}ProviderControl: FC<I${name}ProviderControlProps> = props => <SourceControlProvider<IQueryFilter<${request}>, IQueryOrderBy<${request}>> name={"${name}"} {...props}/>;

export interface I${name}ListSourceProps extends Partial<IListProps<${response}>> {
	providerProps?: Partial<I${name}ProviderProps>;
}

export const ${name}ListSource: FC<I${name}ListSourceProps> = ({providerProps, ...props}) => {
	return <${name}Provider
		withCount
		{...providerProps}
	>
		<List<${response}>
			{...props}					
		/>
	</${name}Provider>;
}

export interface I${name}InfiniteListSourceProps extends Partial<IInfiniteListProps<${response}>> {
	providerProps?: Partial<I${name}ProviderProps>;
}

export const ${name}InfiniteListSource: FC<I${name}InfiniteListSourceProps> = ({providerProps, ...props}) => {
	return <${name}Provider
		withCount
		{...providerProps}
	>
		<InfiniteList<${response}>
			{...props}					
		/>
	</${name}Provider>;
}

export interface I${name}SourceSelectProps extends IQuerySourceSelectProps<${response}> {
	toOption: IToOptionMapper<${response}>;
	providerProps?: Partial<I${name}ProviderProps>;
	selectionList?: () => ReactNode;
	selectionProps?: Partial<ISelectionProviderProps>;
}

export const ${name}SourceSelect: FC<I${name}SourceSelectProps> = ({providerProps, selectionList, selectionProps, ...props}) => {
	return <Input.Group>
		<Row>
			<Col flex={"auto"}> 
				<${name}Provider {...providerProps}>
					<QuerySourceSelect<${response}> {...props}/>
				</${name}Provider>
			</Col>
			<Col push={0}>
				{selectionList && <DrawerButton
					icon={<SelectOutlined/>}
					title={"common.selection.${name}.title"}
					size={props.size}
					tooltip={"common.selection.${name}.title.tooltip"}
					width={800}
					type={'text'}
					ghost
				>
					<${name}ProviderControl>
						<SelectionProvider type={"single"} {...selectionProps}>
							{selectionList()}
						</SelectionProvider>
					</${name}ProviderControl>
				</DrawerButton>}
			</Col>
		</Row>
	</Input.Group>;
};

export interface I${name}SelectionProviderProps extends Partial<ISelectionProviderProps<${response}>> {
}

export const ${name}SelectionProvider: FC<I${name}SelectionProviderProps> = props => {
	return <SelectionProvider<${response}> {...props}/>
}

export const use${name}CountQueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}CountApiLink]);
};

export const use${name}QueryInvalidate = (withCount: boolean = true) => {
	const queryClient = useQueryClient();
	return () => Promise.all([
		queryClient.invalidateQueries([${name}ApiLink]),
		withCount && queryClient.invalidateQueries([${name}CountApiLink]),
	]);
};

export const use${name}OptionalSelectionContext = () => useOptionalSelectionContext<${response}>();
export const use${name}SelectionContext = () => useSelectionContext<${response}>();
`);
}
