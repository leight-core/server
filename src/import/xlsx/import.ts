import {IImportEvents, IImportHandlers, IImportMeta, IImportTabs, IImportTranslations, IJob} from "@leight-core/api";
import {measureTime} from "measure-time";
import {Readable} from "node:stream";
import xlsx from "xlsx";
import {Logger} from "../../logger";

export const toTabs = (workbook: xlsx.WorkBook): IImportTabs[] => {
	const tabs = workbook.Sheets["tabs"];
	if (!tabs) {
		return [];
	}
	return xlsx.utils.sheet_to_json<{ tab: string, services: string }>(tabs).map<IImportTabs>(({tab, services}) => ({tab, services: services.split(/,\s+/g)}));
};

export const toTranslations = (workbook: xlsx.WorkBook): IImportTranslations => {
	const translations = workbook.Sheets["translations"];
	if (!translations) {
		return {};
	}
	return xlsx.utils.sheet_to_json<{ from: string, to: string }>(translations).reduce<IImportTranslations>((obj, current) => {
		obj[current.from] = current.to;
		return obj;
	}, {});
};

export const toMeta = (workbook: xlsx.WorkBook): IImportMeta => ({
	tabs: toTabs(workbook),
	translations: toTranslations(workbook),
});

export const toImport = async (job: IJob<{ fileId: string }>, workbook: xlsx.WorkBook, handlers: IImportHandlers, events?: IImportEvents): Promise<Omit<IJob, "params" | "name" | "skipRatio" | "successRatio" | "failureRatio" | "id" | "userId" | "status" | "progress" | "created">> => {
	const logger = Logger("import");
	const jobLabels = {fileId: job.params?.fileId, userId: job.userId, jobId: job.id};
	logger.info("Executing import", {labels: jobLabels, jobId: job.id});
	const meta = toMeta(workbook);
	logger.info("Meta", {labels: jobLabels, meta});

	let total = 0;
	let processed = 0;
	let success = 0;
	let failure = 0;
	let skip = 0;
	await Promise.all(meta.tabs.map(async tab => {
		const workSheet = workbook.Sheets[tab.tab];
		if (!workSheet) {
			return;
		}
		await Promise.all(tab.services.map(async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _ of xlsx.stream.to_json(workSheet)) {
				total++;
			}
		}));
	}));

	logger.debug("Total", {labels: jobLabels, total});
	await events?.onTotal?.(total);

	await Promise.all(meta.tabs.map(async tab => {
		const workSheet = workbook.Sheets[tab.tab];
		if (!workSheet) {
			return;
		}
		return await Promise.all(tab.services.map(async service => {
			return await (async () => {
				const serviceLabels = {...jobLabels, service, tab: tab.tab};
				logger.info("Executing import", {labels: serviceLabels, tab: tab.tab, service});
				const stream: Readable = xlsx.stream.to_json(workSheet);
				const handler = handlers[service]?.();
				if (!handler) {
					logger.error("Import handler not found.", {labels: serviceLabels, tab: tab.tab, service});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					for await (const _ of stream) {
						skip++;
						processed++;
						await events?.onSkip?.(skip, total, processed);
					}
					return;
				}
				await handler.begin?.({});
				const getElapsed = measureTime();
				for await (const item of stream) {
					processed++;
					try {
						await handler.handler(Object.keys(item).reduce<any>((obj, key) => {
							obj[meta.translations[key] || key] = item[key];
							return obj;
						}, {}));
						success++;
						await events?.onSuccess?.(success, total, processed);
					} catch (e) {
						failure++;
						await events?.onFailure?.(e as Error, failure, total, processed);
						logger.error("Error on item", {labels: serviceLabels, tab: tab.tab, service, error: e, item});
					}
				}
				logger.debug("Import results:", {
					labels: serviceLabels,
					tab,
					service,
					total,
					success,
					failure,
					skip,
					runtime: getElapsed().millisecondsTotal,
				});
				await handler.end?.({});
				logger.info(`Service done.`, {labels: serviceLabels, tab: tab.tab, service});
			})();
		}));
	}));
	logger.info("Job Done", {labels: jobLabels});

	return {
		failure,
		success,
		skip,
		total,
	};
};
