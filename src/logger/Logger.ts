import isObject from "isobject";
import winston, {LoggerOptions} from "winston";

export const Logger = (id: string, options?: LoggerOptions): ReturnType<typeof winston["loggers"]["get"]> => {
	const logger = winston.loggers.get(id, options);
	const log = logger.log;
	logger.log = function (...args) {
		if (args.length >= 3 && isObject(args[2]) && !args[2].labels) {
			args[2] = {labels: args[2]};
		}
		return log.apply(logger, args as any);
	} as typeof log;
	return logger;
};
