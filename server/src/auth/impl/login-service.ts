import * as authUtils from "../internal/utils"
import TokenPair from "../types/token-pair";
import BasicAuthContent from "../types/basic-auth-content";
import UserEntry from "../types/user-entry";

export default class LoginService {

    constructor(
        private readonly getUserByUsername: (username: string) => Promise<UserEntry | undefined>,
        private readonly refreshTokens: (userId: number) => Promise<TokenPair>
    )
    {}

    /**
     * Performs a basic auth login. On success, returns new session- and refresh-token for that user. On failure, returns
     * undefined.
     */
    async performLogin(basicAuth: BasicAuthContent): Promise<TokenPair | undefined>
    {
        const userEntry = await this.getUserByUsername(basicAuth.username);
        if (!userEntry) {
            return undefined;
        }

        /* Compare password hash */
        if (await authUtils.validatePassword(basicAuth.password, userEntry.passwordHash) == false) {
            return undefined;
        }

        /* Correct credentials. Generate new tokens and return */
        return await this.refreshTokens(userEntry.userId);
    }

}

