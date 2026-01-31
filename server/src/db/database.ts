import { performInTransaction, runSql } from "./impl/sql-functions";
import openDatabase from "./impl/database-init";
import { performDatabaseMigrations } from "./impl/database-migration";

const database = {
    openDatabase,
    runSql,
    performInTransaction,
    performDatabaseMigrations
};

export default database;