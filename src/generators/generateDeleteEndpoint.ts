import {ISdk} from "@leight-core/api";
import {generateMutationEndpoint} from "@leight-core/server";

export const generateDeleteEndpoint = (sdk: ISdk) => generateMutationEndpoint(sdk);
