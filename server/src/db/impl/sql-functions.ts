import * as sqlite from "sqlite"

/**
 * Executes the given statement (plus given parameters) using a prepared statement and returns the result rows as an
 * array.
 */
export async function runSql(db: sqlite.Database, sql: string, ...params: unknown[]): Promise<any[]> {
    const statement = await db.prepare(sql);
    try {
        return await statement.all(...params);
    } finally {
        await statement.finalize();
    }
}

/**
 * Performs the given function inside of a single database transaction. On failure, the transaction will be rollbacked.
 */
export async function performInTransaction<T>(db: sqlite.Database, fn: () => Promise<T>): Promise<T> {
    /* Start the transaction */
    await runSql(db, "BEGIN");

    /* Perform the function, then close. */
    try {
        const ret = await fn();
        await runSql(db, "COMMIT");
        return ret;
    } catch (error) {
        await runSql(db, "ROLLBACK");
        throw error;
    }
}