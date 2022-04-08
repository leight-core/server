import winston from "winston";
import LokiTransport from "winston-loki";
import TransportStream from "winston-transport";

const {transports} = winston;
const {format} = winston;

interface LokiTransportOptions extends TransportStream.TransportStreamOptions {
	host: string;
	basicAuth?: string;
	headers?: object;
	interval?: number;
	json?: boolean;
	batching?: boolean;
	labels?: object;
	clearOnError?: boolean,
	replaceTimestamp?: boolean,
	gracefulShutdown?: boolean,
	timeout?: number,

	onConnectionError?(error: unknown): void
}

export const createConsole = () => new transports.Console({
	format: format.combine(
		format.colorize(),
		format.simple(),
	),
});

export const createLoki = (options?: Partial<LokiTransportOptions>) => new LokiTransport({
	level: "debug",
	host: (() => {
		const url = process.env.LOKI_URL;
		if (!url) {
			throw new Error(`Missing Loki env variable "LOKI_URL", for example http://127.0.0.1:3100.`);
		}
		return url;
	})(),
	...options,
});
