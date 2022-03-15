import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateMutationEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{imports: ['FC'], from: '"react"'},
		{imports: ['IQueryParams'], from: '"@leight-core/api"'},
		{imports: ['useQueryClient'], from: '"react-query"'},
		{
			imports: [
				'Form',
				'IFormProps',
				'useSourceContext',
				'ISourceProviderProps',
				'createQueryHook',
				'createPromiseHook',
				'useLinkContext',
				'createMutationHook',
			],
			from: '"@leight-core/client"',
		},
	]);

	const name = generatorCommons.name;
	const generics = generatorCommons.generics.join(', ');

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";

export type I${name}QueryParams = ${generatorCommons.generics[2] || 'void'};

export const use${name}Mutation = createMutationHook<${generics}>(${name}ApiLink, "post");

export const use{$name}QueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}ApiLink]);
}

export interface I${name}DefaultFormProps extends Partial<IFormProps<${generics}>> {
}

export const ${name}DefaultForm: FC<I${name}DefaultFormProps> = props => <Form<${generics}>
	useMutation={use${name}Mutation}
	{...props}
/>

export const use${name}Link = (): ((query: I${name}QueryParams) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${name}ApiLink, query);
}

export const use${name}Promise = createPromiseHook<${generics}>(${name}ApiLink, "post");
`);
}
