export const onUnique = async <T>(e: any, callback: (e: Error) => Promise<T>): Promise<T> => {
	if (e instanceof Error) {
		if (e.message.includes("Unique constraint failed on the fields") || e.message.includes("Unique constraint failed on the constraint")) {
			return callback(e);
		}
	}
	throw e;
};
