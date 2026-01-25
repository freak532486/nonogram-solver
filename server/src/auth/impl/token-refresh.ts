import * as authUtils from "../internal/utils"
import database from "../../db/database"
import { Database } from "sqlite";
import TokenStore from "../types/token-store"
import { FastifyInstance } from "fastify"
import TokenPair from "../types/token-pair"
import { REFRESH_TOKEN_EXPIRY_MS } from "../internal/constants";

/**
 * Regenerates the session- and refresh-token for the given user.
 */
export async function refreshTokenForUser(fastify: FastifyInstance, userId: number): Promise<TokenPair> {
    /* Fetch state from fastify instance */
    const db: Database = fastify.state.db;
    const tokenStore: TokenStore = fastify.state.tokenStore;

    /* Generate tokens */
    const sessionToken = authUtils.generateRandomToken();
    const refreshToken = authUtils.generateRandomToken();
    const creationTimestamp = Date.now();

    /* Write refresh token into database */
    const sql = `
        INSERT INTO user_sessions (user_id, refresh_token, creation_timestamp)
        VALUES ($userId, $refreshToken, $creationTimestamp)
        ON CONFLICT DO UPDATE 
        SET refresh_token = $refreshToken, creation_timestamp = $creationTimestamp
    `;

    const params = {
        $userId: userId,
        $refreshToken: refreshToken,
        $creationTimestamp: creationTimestamp
    };

    await database.runSql(db, sql, params);

    /* Write session token into memory */
    tokenStore.putSessionToken(userId, sessionToken);

    /* Done */
    return {
        "sessionToken": sessionToken,
        "refreshToken": refreshToken
    }
}

/**
 * Refreshes the tokens for the session with the given refresh token. Returns undefined if no such session exists.
 */
export async function refreshSession(fastify: FastifyInstance, refreshToken: string): Promise<TokenPair | undefined> {
    const db = fastify.state.db;

    /* Find user for given refresh token */
    const latestPossibleTimestamp = Date.now() - REFRESH_TOKEN_EXPIRY_MS;
    const sql = `
        SELECT user_id 
        FROM user_sessions 
        WHERE refresh_token = $refreshToken 
        AND creation_timestamp < $latestPossibleTimestamp
    `;

    const result = await database.runSql(db, sql, {
        "refreshToken": refreshToken,
        $latestPossibleTimestamp: latestPossibleTimestamp
    });

    /* No session => Cannot refresh */
    if (!result || result.length == 0) {
        return undefined;
    }

    /* Perform refresh */
    return await refreshTokenForUser(fastify, result[0].user_id);
}

/**
 * Returns the id of the user that owns the given session. Returns undefined if the session token is invalid.
 */
export async function getUserIdForSession(fastify: FastifyInstance, sessionToken: string): Promise<number | undefined>
{
    return fastify.state.tokenStore.getUserId(sessionToken);

}