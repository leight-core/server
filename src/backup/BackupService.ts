import {IBackupRequest, IBackupService, IContainer, IFileSource, IJobProgress, ISource, IUser} from "@leight-core/api";
import {zipOf} from "@leight-core/server";
import dayjs from "dayjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {Logger} from "winston";

export interface IBackupServiceDeps<TContainer extends IContainer<IFileSource<any, any>>> {
	sources: ISource<any, any, any>[];
	user: IUser;
	container: TContainer;
	jobProgress: IJobProgress;
	logger: Logger;
	temp?: string;
}

export const BackupService = <TContainer extends IContainer<IFileSource<any, any>>>(deps: IBackupServiceDeps<TContainer>) => new BackupServiceClass(deps);

export class BackupServiceClass<TContainer extends IContainer<IFileSource<any, any>>> implements IBackupService {
	readonly sources: ISource<any, any, any>[];
	readonly temp: string;
	readonly container: TContainer;
	readonly user: IUser;
	readonly logger: Logger;
	readonly jobProgress: IJobProgress;

	constructor({sources, container, user, logger, jobProgress, temp}: IBackupServiceDeps<TContainer>) {
		this.sources = sources;
		this.temp = temp || os.tmpdir();
		this.container = container;
		this.user = user;
		this.logger = logger;
		this.jobProgress = jobProgress;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async backup(backup: IBackupRequest): Promise<void> {
		return this.container.useFileSource(async fileSource => {
			const stamp = dayjs().format("YYYY-MM-DD");
			fileSource.withUser(this.user);
			const file = await fileSource.store({
				path: "/backup",
				name: `Backup-${stamp}.zip`,
				replace: true,
			});
			const backup = path.normalize(`${this.temp}/backup/${stamp}`);
			fs.mkdirSync(backup, {recursive: true});

			await Promise.all(this.sources.map(async source => {
				try {
					await this.export(backup, source);
				} catch (e) {
					this.logger.error(e);
				}
			}));

			zipOf(backup, file.location);

			fs.rmSync(backup, {recursive: true, force: true});
			await fileSource.refresh(file.id);
			this.logger.debug(`Finished backup of ${file.location}.`);
		});
	}

	async export(backup: string, source: ISource<any, any, any>) {
		const $path = path.normalize(`${backup}/source/${source.name}`);
		fs.mkdirSync($path, {recursive: true});
		const size = 250;
		const total = await source.count({});
		const pages = Math.ceil(total / size);
		for (let page = 0; page <= pages; page++) {
			for (const entity of await source.query({page, size})) {
				fs.writeFileSync(path.normalize(`${$path}/${entity.id}.json`), JSON.stringify({
					source: entity,
					entity: await source.map(entity),
				}));
			}
		}
	}
}
