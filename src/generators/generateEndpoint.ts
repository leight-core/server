import {generateMutationEndpoint} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export const generateEndpoint = (sdk: ISdk) => generateMutationEndpoint(sdk);
