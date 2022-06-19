import {ClientError, IUser} from "@leight-core/api";
import {diffOf, intersectOf} from "@leight-core/utils";

export const User = (userId?: string | null, tokens: string[] = []): IUser => {
	const $user: IUser = ({
		required: () => {
			if (!userId) {
				throw new UndefinedUserError("User not available");
			}
			return userId;
		},
		optional: () => userId || undefined,
		hasAny: $tokens => intersectOf(tokens, $tokens).length > 0,
		checkAny: tokens => {
			if (!$user.hasAny(tokens)) {
				throw new ClientError("User does not have required tokens.", 403);
			}
		},
		hasTokens: $tokens => diffOf($tokens, tokens).length === $tokens.length,
		checkTokens: tokens => {
			if (!$user.hasTokens(tokens)) {
				throw new ClientError("User does not have required tokens.", 403);
			}
		}
	});

	return $user;
};

export class UndefinedUserError extends ClientError {
	constructor(message: string) {
		super(message, 403);
	}
}
