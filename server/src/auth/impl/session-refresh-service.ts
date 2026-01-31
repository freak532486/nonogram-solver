import * as authUtils from "../internal/utils"
import TokenPair from "../types/token-pair"

export default class SessionRefreshService {

    constructor(
        private readonly putSessionToken: (userId: number, sessionToken: string, creationTime: number) => Promise<void>,
        private readonly putRefreshToken: (userId: number, refreshToken: string, creationTime: number) => Promise<void>,
        private readonly getUserForRefreshToken: (refreshToken: string) => Promise<number | undefined>
    ) {}

    /**
     * Regenerates the session- and refresh-token for the given user.
     */
    async refreshTokenForUser(userId: number): Promise<TokenPair> {
        /* Generate tokens */
        const sessionToken = authUtils.generateRandomToken();
        const refreshToken = authUtils.generateRandomToken();
        const creationTimestamp = Date.now();

        /* Write tokens into token stores */
        await this.putSessionToken(userId, sessionToken, creationTimestamp);
        await this.putRefreshToken(userId, refreshToken, creationTimestamp);

        /* Done */
        return {
            "sessionToken": sessionToken,
            "refreshToken": refreshToken
        }
    }

    /**
     * Refreshes the tokens for the session with the given refresh token. Returns undefined if no such session exists.
     */
    async refreshSession(refreshToken: string): Promise<TokenPair | undefined> {
        const userId = await this.getUserForRefreshToken(refreshToken);
        if (userId == undefined) {
            return undefined;
        }

        /* Perform refresh */
        return this.refreshTokenForUser(userId);
    }

}