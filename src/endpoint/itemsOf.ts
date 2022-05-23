import {mapOf} from "@leight-core/utils";

export const itemsOf = async <T, R, U>(source: Promise<T[]>, map: (item: T) => R, mapper: (item: R) => Promise<U>): Promise<U[]> => await mapOf(source, map, mapper);
