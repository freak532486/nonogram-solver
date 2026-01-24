import * as authUtils from "../internal/utils"
import { Database } from "sqlite";
import database from "../../db/database";
import { FastifyInstance } from "fastify";
import TokenPair from "../types/token-pair";
import auth from "../auth";
import BasicAuthContent from "../types/basic-auth-content";

/**
 * Performs a basic auth login. On success, returns new session- and refresh-token for that user. On failure, returns
 * undefined.
 */
export default async function performLogin(fastify: FastifyInstance, basicAuth: BasicAuthContent): Promise<TokenPair | undefined> {
    /* Fetch state from fastify object */
    const db: Database = fastify.state.db;

    /* Find user entry in database */
    const sql = "SELECT id, password_hash FROM users WHERE username = ?";
    const results = await database.runSql(db, sql, basicAuth.username);

    /* Bad auth if user was not found */
    if (results.length == 0) {
        return undefined;
    }

    /* Compare password hash */
    const storedHash = results[0].password_hash;
    if (await authUtils.validatePassword(basicAuth.password, storedHash) == false) {
        return undefined;
    }

    /* Correct credentials. Generate new tokens and return */
    const userId = results[0].id;
    return await auth.refreshTokenForUser(fastify, userId);
}

