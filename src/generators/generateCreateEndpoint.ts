import {generateMutationEndpoint} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export const generateCreateEndpoint = (sdk: ISdk) => generateMutationEndpoint(sdk);
