export default interface DatabaseAccess {
    
    /**
     * Executes the given statement (plus given parameters) using a prepared statement and returns the result rows as
     * an array.
     */
    runSql(sql: string, ...params: unknown[]): Promise<any[]>;

    /**
     * Performs the given function inside of a single database transaction. On failure, the transaction will be
     * rollbacked.
     */
    performInTransaction<T>(fn: () => Promise<T>): Promise<T>;

}