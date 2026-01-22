import * as fs from "fs"
import * as sqlite3 from "sqlite3";
import * as sqlite from "sqlite"
import { ConfigAccess } from "../config/config-access";

export class DatabaseAccess {

    readonly #configAccess; 

    #db: sqlite.Database | undefined;

    constructor(configAccess: ConfigAccess) {
        this.#configAccess = configAccess;
    }

    /**
     * Initializes this service.
     */
    async init() {
        const dbPath = this.#configAccess.getStringSetting("databasePath");
        if (!dbPath) {
            throw new Error("'databasePath' was not set in settings file.");
        }

        /* Check if this is the initial database creation */
        const databaseExists = fs.existsSync(dbPath);

        /* Create or open the database */
        const database = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        this.#db = database;

        /* Run initialization if database did not exist */
        if (databaseExists) {
            return;
        }

        /* Remove database again so that it is re-initialized on next startup */
        try {
            await this.performInTransaction(() => this.#runDatabaseInitialization());
        } catch (error) {
            database.close();
            fs.rmSync(dbPath);
            throw error;
        }
    }

    async #runDatabaseInitialization() {
        /* Create migration script table */
        const sql = "CREATE TABLE migration_history (id varchar(255), PRIMARY KEY (id));";
        await this.run(sql);
    }

    /**
     * Performs an SQL statement and returns the result.
     */
    async run(sql: string, ...params: unknown[]): Promise<sqlite.ISqlite.RunResult> {
        if (!this.#db) {
            throw new Error("Database connection has not been initalized");
        }

        const statement = await this.#db.prepare(sql, params);
        try {
            return await statement.run();
        } finally {
            await statement.finalize();
        }
    }

    /**
     * Performs the given function inside of a single transaction. On failure, the transaction will be rollbacked.
     */
    async performInTransaction<T>(fn: () => Promise<T>): Promise<T> {
        /* Start the transaction */
        await this.run("BEGIN");

        /* Perform the function, then close. */
        try {
            const ret = await fn();
            await this.run("COMMIT");
            return ret;
        } catch (error) {
            await this.run("ROLLBACK");
            throw error;
        }
    }

};