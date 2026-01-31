import { FastifyInstance } from "fastify";
import * as dbAccess from "./sql-functions"
import authTableCreation from "../internal/migrations/0001-auth-table-creation";
import createSavestateTable from "../internal/migrations/0002-create-savestate-table";
import database from "../database";

/**
 * Performs all necessary database migrations.
 */
export async function performDatabaseMigrations(fastify: FastifyInstance): Promise<void> {
    /* Get state from fastify instance */
    const db = fastify.state.db;

    /* Create list of all migrations */
    const migrations: Array<DatabaseMigration> = [
        { "identifier": "AuthTableCreation", "run": authTableCreation },
        { "identifier": "CreateSavestateTable", "run": createSavestateTable }
    ];

    /* Fetch list of ran migrations */
    const sql = "SELECT id FROM migration_history";
    const migrationHistory = (await database.runSql(db, sql)).map(x => x.id);

    /* Run each migration */
    for (const migration of migrations) {
        await dbAccess.performInTransaction(db, async () => {
            /* Check if migration has been performed already */
            if (migrationHistory.includes(migration.identifier)) {
                return;
            }

            /* Perform database migration */
            fastify.log.info("Executing database migration '" + migration.identifier + "'");
            await migration.run(fastify);

            /* Write into migration log */
            const insertSql = "INSERT INTO migration_history(id) VALUES ($id)";
            database.runSql(db, insertSql, { $id: migration.identifier });
        });
    }
}

interface DatabaseMigration {
    identifier: string;
    run: (fastify: FastifyInstance) => Promise<void>;
}