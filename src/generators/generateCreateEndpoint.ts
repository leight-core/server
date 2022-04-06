import {ISdk} from "@leight-core/api";
import {generateMutationEndpoint} from "@leight-core/server";

export const generateCreateEndpoint = (sdk: ISdk) => generateMutationEndpoint(sdk);
