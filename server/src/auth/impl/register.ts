import { FastifyInstance } from "fastify";
import { createPasswordHash } from "../internal/utils";
import database from "../../db/database";

/**
 * Registers a new user. Returns the new userId if registration succeeded, and undefined otherwise.
 */
export async function registerUser(
    fastify: FastifyInstance, 
    username: string,
    password: string
): Promise<number | undefined>
{
    const db = fastify.state.db;

    /* Do everything in transaction, just in case of concurrency issues. */
    const result = await database.performInTransaction(db, async () => {
        /* Check if user already exists */
        if (await checkIfUserExists(fastify, username)) {
            return undefined;
        }

        /* Insert new user */
        const hashedPassword = await createPasswordHash(password);
        fastify.log.info(hashedPassword);
        const sql = "INSERT INTO users (username, password_hash) VALUES ($username, $passwordHash) RETURNING *";
        return await database.runSql(db, sql, { $username: username, $passwordHash: hashedPassword});
    });

    /* Return either id or nothing */
    if (!result || result.length == 0) {
        return undefined;
    }

    return result[0].id;
}

export async function checkIfUserExists(fastify: FastifyInstance, username: string) {
    const db = fastify.state.db;

    /* Check if user already exists */
    const sql = "SELECT id FROM users WHERE username = $username";
    const result = await database.runSql(db, sql, { $username: username });
    return result.length !== 0;
}