import {IUser} from "@leight-core/api";

export const User = (userId?: string | null): IUser => ({
	required: () => {
		if (!userId) {
			throw new UndefinedUserError("User not available");
		}
		return userId;
	},
	optional: () => userId || undefined,
});

export class UndefinedUserError extends Error {
}
