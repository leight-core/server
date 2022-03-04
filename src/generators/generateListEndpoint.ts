import {generateFetchEndpoint} from "@leight-core/server";
import {ISdk} from "@leight-core/api";

export const generateListEndpoint = (sdk: ISdk) => generateFetchEndpoint(sdk);
