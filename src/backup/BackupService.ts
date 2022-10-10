import {
	IBackupService,
	IContainer,
	IFileSource,
	IJobProgress,
	ISource,
	IUser
}               from "@leight-core/api";
import archiver from "archiver";
import dayjs    from "dayjs";
import fs       from "node:fs";
import os       from "node:os";
import path     from "node:path";
import {Logger} from "winston";

export interface IBackupServiceDeps<TContainer extends IContainer<IFileSource<any, any>>> {
	version: string;
	sources: ISource<any, any, any>[];
	user: IUser;
	container: TContainer;
	jobProgress: IJobProgress;
	logger: Logger;
	temp?: string;
}

export interface IBackupMeta {
	version: string;
	sources: string[];
}

export const BackupService = <TContainer extends IContainer<IFileSource<any, any>>>(deps: IBackupServiceDeps<TContainer>) => new BackupServiceClass(deps);

export class BackupServiceClass<TContainer extends IContainer<IFileSource<any, any>>> implements IBackupService {
	readonly version: string;
	readonly sources: ISource<any, any, any>[];
	readonly temp: string;
	readonly container: TContainer;
	readonly user: IUser;
	readonly logger: Logger;
	readonly jobProgress: IJobProgress;

	constructor({version, sources, container, user, logger, jobProgress, temp}: IBackupServiceDeps<TContainer>) {
		this.version     = version;
		this.sources     = sources;
		this.temp        = temp || os.tmpdir();
		this.container   = container;
		this.user        = user;
		this.logger      = logger;
		this.jobProgress = jobProgress;
	}

	async backup(): Promise<void> {
		return this.container.useFileSource(async fileSource => {
			fileSource.withUser(this.user);
			const stamp  = dayjs().format("YYYY-MM-DD");
			const backup = path.normalize(`${this.temp}/backup/${stamp}`);
			const file   = await fileSource.store({
				path:    "/backup",
				name:    `Backup-${stamp}.zip`,
				replace: true,
			});
			fs.mkdirSync(backup, {recursive: true});

			fs.writeFileSync(path.normalize(`${backup}/meta.json`), JSON.stringify({
				version: this.version,
				sources: this.sources.map(source => source.name),
			} as IBackupMeta));

			await this.jobProgress.setTotal(1);
			let count = 0;
			for (const source of this.sources) {
				count += await source.count({});
			}
			await this.jobProgress.setTotal(count + 1);
			await this.jobProgress.onSuccess();

			await Promise.all(this.sources.map(async source => {
				try {
					await this.export(backup, source);
				} catch (e) {
					console.error(e);
					this.logger.error(e);
				}
			}));

			const archive = archiver("zip", {
				zlib: {level: 9},
			});
			archive.directory(backup, false);
			archive.pipe(fs.createWriteStream(file.location));
			await archive.finalize();

			fs.rmSync(backup, {recursive: true, force: true});
			await fileSource.refresh(file.id);
			this.logger.debug(`Finished backup of ${file.location}.`);
		});
	}

	async export(backup: string, source: ISource<any, any, any>) {
		const $path = path.normalize(`${backup}/source/${source.name}`);
		fs.mkdirSync($path, {recursive: true});
		const size  = 250;
		const pages = Math.ceil(await source.count({}) / size);
		for (let page = 0; page <= pages; page++) {
			for (const entity of await source.query({page, size})) {
				try {
					fs.writeFileSync(path.normalize(`${$path}/${entity.id}.json`), JSON.stringify(await source.backup(entity)));
					await this.jobProgress.onSuccess();
				} catch (e) {
					await this.jobProgress.onFailure();
					console.error(e);
					this.logger.error(e);
				}
			}
		}
	}
}
