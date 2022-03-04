import {cleanup, toGeneratorCommons} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export function generateMutationEndpoint(sdk: ISdk): string {
	const generatorCommons = toGeneratorCommons(sdk);

	// language=text
	return cleanup(`
import {FC} from "react";
import {Form, IFormProps, useLinkContext, createMutationHook, createPromiseHook} from "@leight-core/client";	
import {AxiosRequestConfig} from "axios";
${sdk.imports.map(_import => `import {${_import.imports.join(", ")}} from ${_import.from};`).join("\n")}

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
