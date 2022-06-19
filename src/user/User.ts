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
		hasAny: $tokens => $tokens && $tokens.length > 0 ? intersectOf(tokens, $tokens).length > 0 : true,
		checkAny: tokens => {
			if (!$user.hasAny(tokens)) {
				throw new ClientError("User does not have required tokens.", 403);
			}
		},
		hasTokens: $tokens => $tokens && $tokens.length > 0 ? diffOf($tokens, tokens).length === $tokens.length : true,
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
