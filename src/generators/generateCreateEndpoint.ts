import {ISdk} from "@leight-core/api";
import {cleanup, generateImports, toGeneratorCommons} from "@leight-core/server";

export function generateCreateEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	sdk.imports.push(...[
		{imports: ["FC"], from: "\"react\""},
		{
			imports: [
				"ISourceCreate",
				"ISourceItem",
			],
			from: "\"@leight-core/api\""
		},
		{
			imports: [
				"Form",
				"IFormProps",
				"MobileForm",
				"IMobileFormProps",
				"createPromiseHook",
				"createPromise",
				"toLink",
				"createMutationHook",
			],
			from: "\"@leight-core/client\"",
		},
	]);

	const name = generatorCommons.name;
	const source = generatorCommons.generics[0];
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

export const use${name}Mutation = createMutationHook<ISourceCreate<${source}>, ISourceItem<${source}>>(${name}ApiLink, "post");

export interface I${name}DefaultFormProps extends Partial<IFormProps<ISourceCreate<${source}>, ISourceItem<${source}>>> {
}

export const ${name}DefaultForm: FC<I${name}DefaultFormProps> = props => <Form<ISourceCreate<${source}>, ISourceItem<${source}>>
	useMutation={use${name}Mutation}
	translation={${name}ApiLink}
	{...props}
/>

export interface I${name}DefaultMobileFormProps extends Partial<IMobileFormProps<ISourceCreate<${source}>, ISourceItem<${source}>>> {
}

export const ${name}DefaultMobileForm: FC<I${name}DefaultMobileFormProps> = props => <MobileForm<ISourceCreate<${source}>, ISourceItem<${source}>>
	useMutation={use${name}Mutation}
	translation={${name}ApiLink}
	{...props}
/>

export const to${name}Link = (queryParams?: ${queryParams}) => toLink(${name}ApiLink, queryParams);
export const use${name}Link = () => to${name}Link;

export const use${name}Promise = createPromiseHook<ISourceCreate<${source}>, ISourceItem<${source}>>(${name}ApiLink, "post");

export const ${name}Promise = createPromise<ISourceCreate<${source}>, ISourceItem<${source}>>(${name}ApiLink, "post");
`);
}

