import DatabaseAccess from "../../access/database-access";
import { REFRESH_TOKEN_EXPIRY_MS } from "../internal/constants";
import UserEntry from "../types/user-entry";

export default class AuthDto {

    constructor(private databaseAccess: DatabaseAccess) {}

    async putRefreshToken(userId: number, refreshToken: string, creationTime: number): Promise<void>
    {
        const sql = `
            INSERT INTO user_sessions (user_id, refresh_token, creation_timestamp)
            VALUES ($userId, $refreshToken, $creationTimestamp)
            ON CONFLICT DO UPDATE
            SET refresh_token = $refreshToken, creation_timestamp = $creationTimestamp
        `;

        await this.databaseAccess.runSql(sql, {
            $userId: userId,
            $refreshToken: refreshToken,
            $creationTimestamp: creationTime
        });
    }

    async getUserForRefreshToken(refreshToken: string): Promise<number | undefined> {
        const lastValidCreationTimestamp = Date.now() - REFRESH_TOKEN_EXPIRY_MS;

        const sql = `
            SELECT user_id
            FROM user_sessions
            WHERE refresh_token = $refreshToken
            AND creation_timestamp >= $lastValidCreationTimestamp
        `;

        const result = await this.databaseAccess.runSql(sql, {
            $refreshToken: refreshToken,
            $lastValidCreationTimestamp: lastValidCreationTimestamp
        });

        if (result.length == 0) {
            return undefined;
        }

        return result[0].user_id;
    }

    async getUserByUsername(username: string): Promise<UserEntry | undefined> {
        const sql = "SELECT * FROM users WHERE username = $username";
        const result = await this.databaseAccess.runSql(sql, { $username: username });

        if (result.length == 0) {
            return undefined;
        }

        return {
            userId: result[0].id,
            username: result[0].username,
            passwordHash: result[0].password_hash
        };
    }

    async createUser(username: string, passwordHash: string): Promise<number | undefined> {
        const sql = `
            INSERT INTO users (username, password_hash)
            VALUES ($username, $passwordHash)
            ON CONFLICT DO NOTHING
            RETURNING id
        `;

        const result = await this.databaseAccess.runSql(sql, {
            $username: username,
            $passwordHash: passwordHash
        });

        if (result.length == 0) {
            return undefined;
        }

        return result[0].id;
    }

}