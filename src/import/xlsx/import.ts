import {IImportHandlers, IImportMeta, IImportTabs, IImportTranslations, IJob, IJobProgress} from "@leight-core/api";
import {Logger} from "@leight-core/server";
import {measureTime} from "measure-time";
import {Readable} from "node:stream";
import xlsx from "xlsx";

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

export interface IToImportRequest {
	job: IJob<{ fileId: string }>;
	workbook: xlsx.WorkBook;
	handlers: IImportHandlers;
	jobProgress: IJobProgress;
}

export const toImport = async ({jobProgress, job, handlers, workbook}: IToImportRequest): Promise<Omit<IJob, "params" | "name" | "skipRatio" | "successRatio" | "failureRatio" | "id" | "userId" | "status" | "progress" | "created">> => {
	const logger = Logger("import");
	const jobLabels = {fileId: job.params?.fileId, userId: job.userId, jobId: job.id};
	logger.info("Executing import", {labels: jobLabels, jobId: job.id});
	const meta = toMeta(workbook);
	logger.info("Meta", {labels: jobLabels, meta});

	let total = 0;
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
	await jobProgress.total(total);

	for (const tab of meta.tabs) {
		const workSheet = workbook.Sheets[tab.tab];
		if (!workSheet) {
			continue;
		}
		for (const service of tab.services) {
			const serviceLabels = {...jobLabels, service, tab: tab.tab};
			logger.info("Executing import", {labels: serviceLabels, tab: tab.tab, service});
			const stream: Readable = xlsx.stream.to_json(workSheet);
			const handler = handlers[service]?.();
			if (!handler) {
				logger.error("Import handler not found.", {labels: serviceLabels, tab: tab.tab, service});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				for await (const _ of stream) {
					skip++;
					await jobProgress.onSkip();
				}
				continue;
			}
			await handler.begin?.({});
			const getElapsed = measureTime();
			for await (const item of stream) {
				try {
					await handler.handler(Object.keys(item).reduce<any>((obj, key) => {
						obj[meta.translations[key] || key] = item[key];
						return obj;
					}, {}));
					success++;
					await jobProgress.onSuccess();
				} catch (e) {
					failure++;
					await jobProgress.onFailure();
					let error = "Error on item";
					const meta = {labels: serviceLabels, tab: tab.tab, service, item};
					if (e instanceof Error) {
						error = e.message;
					}
					logger.error(error, meta);
				}
			}
			await handler.end?.({});
			logger.info("Service done, import results:", {
				labels: serviceLabels,
				tab: tab.tab,
				service,
				total,
				success,
				failure,
				skip,
				runtime: getElapsed().millisecondsTotal,
			});
		}
	}
	logger.info("Job Done", {labels: jobLabels});

	return {
		failure,
		success,
		skip,
		total,
	};
};
