import {IUserService} from "@leight-core/api";

export const UserService = (userId?: string): IUserService => ({
	getUserId: () => {
		if (!userId) {
			throw new Error("User not available");
		}
		return userId;
	},
	getOptionalUserId: () => userId,
});
