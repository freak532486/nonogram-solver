import database from "../../database"
import { FastifyInstance } from "fastify";

/**
 * Creates tables necessary for authentification.
 */
export default async function authTableCreation(fastify: FastifyInstance) {
    const db = fastify.state.db;

    /* Create user table */
    const userTableSql = `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    `;

    await database.runSql(db, userTableSql);

    /* Create session table */
    const userSessionSql = `
    CREATE TABLE user_sessions (
        user_id INTEGER PRIMARY KEY,
        refresh_token TEXT NOT NULL,
        creation_timestamp INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    `

    await database.runSql(db, userSessionSql);
}