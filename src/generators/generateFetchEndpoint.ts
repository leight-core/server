import {cleanup, generateImports} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateFetchEndpoint(sdk: ISdk): string {
	const name = sdk.endpoint.name.replace("Endpoint", "");
	const query = (sdk.endpoint.generics?.[1] || "undefined");
	const response = (sdk.endpoint.generics?.[0] || "void");
	const api = sdk.endpoint.api;

	sdk.imports.push(...[
		{imports: ['FC', 'createContext'], from: '"react"'},
		{imports: ['IQueryParams', 'IEntityContext'], from: '"@leight-core/api"'},
		{
			imports: [
				'createQueryHook',
				'createPromiseHook',
				'useLinkContext',
				'useContext',
				'useOptionalContext',
				'IEntityProviderProps',
				'EntityContext',
				'EntityProvider',
				'IQueryProps',
				'Query',
				'useQueryClient',
			],
			from: '"@leight-core/client"'
		},
	]);

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${api}";

export type I${name}QueryParams = ${query};

export const ${name}Context = createContext(null as unknown as IEntityContext<${response}>);

export const use${name}Context = (): IEntityContext<${response}> => useContext(${name}Context, "${name}Context");
export const useOptional${name}Context = () => useOptionalContext<IEntityContext<${response}>>(${name}Context as any);

export interface I${name}Provider extends IEntityProviderProps<${response}> {
}

export const ${name}Provider: FC<I${name}Provider> = ({defaultEntity, ...props}) => {
	return <EntityProvider defaultEntity={defaultEntity}>
		<EntityContext.Consumer>
			{entityContext => <${name}Context.Provider value={entityContext} {...props}/>}
		</EntityContext.Consumer>
	</EntityProvider>;
};

export const use${name}Query = createQueryHook<void, ${response}, I${name}QueryParams>(${name}ApiLink, "get");

export const use${name}QueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}ApiLink]);
}

export const use${name}Link = (): ((query: I${name}QueryParams) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${name}ApiLink, query);
}

export const use${name}Promise = createPromiseHook<void, ${response}, I${name}QueryParams>(${name}ApiLink, "get");

export interface IFetch${name}Props extends Partial<IQueryProps<void, ${response}, I${name}QueryParams>> {
}

export const Fetch${name}: FC<IFetch${name}Props> = props => <Query<void, ${response}, I${name}QueryParams>
	useQuery={use${name}Query}
	request={undefined}
	context={useOptional${name}Context()}
	{...props}
/>;
`);
}
