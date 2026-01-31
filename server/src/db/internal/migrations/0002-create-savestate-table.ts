import { FastifyInstance } from "fastify";
import database from "../../database";

export default async function createSavestateTable(fastify: FastifyInstance): Promise<void>
{
    /* Get database from server instance */
    const db = fastify.state.db;

    /* Create table */
    const sql = `
        CREATE TABLE savefiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            save_file BLOB NOT NULL,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `;

    await database.runSql(db, sql);
}