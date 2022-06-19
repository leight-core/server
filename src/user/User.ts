import {ClientError, IUser} from "@leight-core/api";
import {diffOf, intersectOf} from "@leight-core/utils";

export const User = (userId?: string | null, tokens: string[] = []): IUser => {
	const $user: IUser = ({
		tokens,
		required: () => {
			if (!userId) {
				throw new UndefinedUserError("User not available");
			}
			return userId;
		},
		optional: () => userId || undefined,
		hasAny: $tokens => $tokens && $tokens.length > 0 ? intersectOf(tokens, $tokens).length > 0 : true,
		checkAny: $tokens => {
			if (!$user.hasAny($tokens)) {
				throw new AclError("User does not have required tokens.", tokens, $tokens);
			}
		},
		hasTokens: $tokens => $tokens && $tokens.length > 0 ? diffOf($tokens, tokens).length === $tokens.length : true,
		checkTokens: $tokens => {
			if (!$user.hasTokens($tokens)) {
				throw new AclError("User does not have required tokens.", tokens, $tokens);
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

export class AclError extends ClientError {
	readonly tokens: string[];
	readonly requested?: string[];

	constructor(message: string, tokens: string[], requested?: string[]) {
		super(message, 403);
		this.tokens = tokens;
		this.requested = requested;
	}
}
