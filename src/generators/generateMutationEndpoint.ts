import {ISdk} from "@leight-core/api";
import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";

export function generateMutationEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{imports: ["FC"], from: "\"react\""},
		{imports: ["IQueryParams"], from: "\"@leight-core/api\""},
		{imports: ["useQueryClient"], from: "\"react-query\""},
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
				"createMutationHook",
			],
			from: "\"@leight-core/client\"",
		},
	]);

	const name = generatorCommons.name;
	const generics = generatorCommons.generics.join(", ");
	const queryParams = `I${name}QueryParams`;

	// language=text
	return cleanup(`
/**
 * Generated file; DO NOT modify as it could be overridden by a generator.
 */

${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";

export type ${queryParams} = ${generatorCommons.generics[2] || "undefined"};

export const use${name}Mutation = createMutationHook<${generics}>(${name}ApiLink, "post");

export const use${name}QueryInvalidate = () => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries([${name}ApiLink]);
}

export interface I${name}DefaultFormProps extends Partial<IFormProps<${generics}>> {
}

export const ${name}DefaultForm: FC<I${name}DefaultFormProps> = props => <Form<${generics}>
	useMutation={use${name}Mutation}
	{...props}
/>

export const to${name}Link = (queryParams?: ${queryParams}) => toLink(${name}ApiLink, queryParams);
export const use${name}Link = () => to${name}Link;

export const use${name}Promise = createPromiseHook<${generics}>(${name}ApiLink, "post");

export const ${name}Promise = createPromise<${generics}>(${name}ApiLink, "post");
`);
}
