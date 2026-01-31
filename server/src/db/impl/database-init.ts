import * as fs from "fs"
import * as sqlite from "sqlite"
import * as sqlite3 from "sqlite3"
import database from "../database"
import { FastifyInstance } from "fastify";

/**
 * Opens a database connection to an SQLite database. Path to database must be supplied.
 */
export default async function openDatabase(fastify: FastifyInstance, dbPath: string): Promise<sqlite.Database> {
    /* Check if this is the initial database creation */
    const databaseExists = fs.existsSync(dbPath);

    /* Create or open the database */
    const db = await sqlite.open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    /* Run initialization if database did not exist */
    if (databaseExists) {
        return db;
    }

    /* Remove database again so that it is re-initialized on next startup */
    try {
        fastify.log.info("Performing database initialization");
        await database.performInTransaction(db, () => runDatabaseInitialization(db));
        return db;
    } catch (error) {
        db.close();
        fs.rmSync(dbPath);
        throw error;
    }
}

async function runDatabaseInitialization(db: sqlite.Database) {
    /* Enable foreign key constraints */
    await database.runSql(db, "PRAGMA foreign_keys = ON");

    /* Create migration script table */
    const migrationTableSql = "CREATE TABLE migration_history (id varchar(255), PRIMARY KEY (id));";
    await database.runSql(db, migrationTableSql);
}