import {ISdk} from "@leight-core/api";
import {
	cleanup,
	generateImports,
	toGeneratorCommons
}             from "@leight-core/server";

export function generateCreateEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{imports: ["FC"], from: "\"react\""},
		{
			imports: [
				"InferSource",
			],
			from:    "\"@leight-core/api\""
		},
		{
			imports: [
				"Form",
				"IFormProps",
				"createPromiseHook",
				"createPromise",
				"toLink",
				"createMutationHook",
			],
			from:    "\"@leight-core/client\"",
		},
	]);

	const name        = generatorCommons.name;
	const source      = generatorCommons.generics[0];
	const queryParams = `I${name}QueryParams`;

	// language=text
	return cleanup(`
/**
 * Generated file; DO NOT modify as it could be overridden by a generator.
 */

${generateImports(sdk.imports)}

${sdk.interfaces.map(item => item.source).join("\n")}

export const ${name}ApiLink = "${generatorCommons.api}";

export type ${queryParams} = ${generatorCommons.generics[2] || "any"};

export const use${name}Mutation = createMutationHook<InferSource.Create<${source}>, InferSource.Item<${source}>>(${name}ApiLink, "post");

export interface I${name}DefaultFormProps extends Partial<IFormProps<InferSource.Create<${source}>, InferSource.Item<${source}>>> {
}

export const ${name}DefaultForm: FC<I${name}DefaultFormProps> = props => <Form<InferSource.Create<${source}>, InferSource.Item<${source}>>
	useMutation={use${name}Mutation}
	translation={${name}ApiLink}
	{...props}
/>

export const to${name}Link = (queryParams?: ${queryParams}) => toLink(${name}ApiLink, queryParams);
export const use${name}Link = () => to${name}Link;

export const use${name}Promise = createPromiseHook<InferSource.Create<${source}>, InferSource.Item<${source}>>(${name}ApiLink, "post");

export const ${name}Promise = createPromise<InferSource.Create<${source}>, InferSource.Item<${source}>>(${name}ApiLink, "post");
`);
}

