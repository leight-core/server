import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateMutationEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{imports: ['FC'], from: '"react"'},
		{imports: ['AxiosRequestConfig'], from: '"axios"'},
		{imports: ['IQueryParams'], from: '"@leight-core/api"'},
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

	// language=text
	return cleanup(`
${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${generatorCommons.name}ApiLink = "${generatorCommons.api}";

export type I${generatorCommons.name}QueryParams = ${generatorCommons.query};

export const use${generatorCommons.name}Mutation = createMutationHook<${generatorCommons.generics}>(${generatorCommons.name}ApiLink, "post");

export interface I${generatorCommons.name}DefaultFormProps extends Partial<IFormProps<${generatorCommons.generics}>> {
}

export const ${generatorCommons.name}DefaultForm: FC<I${generatorCommons.name}DefaultFormProps> = props => <Form<${generatorCommons.generics}>
	useMutation={use${generatorCommons.name}Mutation}
	{...props}
/>

export const use${generatorCommons.name}Link = (): ((query: I${generatorCommons.name}QueryParams) => string) => {
	const linkContext = useLinkContext();
	return query => linkContext.link(${generatorCommons.name}ApiLink, query);
}

export const use${generatorCommons.name}Promise = createPromiseHook<${generatorCommons.generics}>(${generatorCommons.name}ApiLink, "post");
`);
}
