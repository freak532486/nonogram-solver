import { StorageContent } from "./common/storage-types.js";
import * as storage from "./storage.js"

export async function performStorageMigration() {
    await MIGR001_migrateStorageKey();

    const val = storage.fetchStorage();

    await MIGR002_addVersionKey(val);
    await MIGR003_addSolvedFlag(val);

    storage.putStorage(val);
}

/**
 * MIGR001: Storage used to be stored under the key "storage_v0.03". It should be stored under the key "storage" now.
 */
async function MIGR001_migrateStorageKey() {
    const OLD_KEY = "storage_v0.03";
    const NEW_KEY = storage.STORAGE_KEY;

    const oldVal = window.localStorage.getItem(OLD_KEY);
    if (!oldVal) {
        return;
    }

    window.localStorage.setItem(NEW_KEY, oldVal);
    window.localStorage.removeItem(OLD_KEY);
}

/**
 * MIGR002: Adds a version key to the storage, so that migrations can detect old versions.
 * 
 * @param {StorageContent} val 
 */
async function MIGR002_addVersionKey(val) {
    const VERSION_KEY = 1;

    if (!val.versionKey) {
        val.versionKey = VERSION_KEY;
    }

    storage.putStorage(val);
}

/**
 * MIGR003: Adds the "elapsed" time to the savestate. Since we don't know how long the player has played the nonogram,
 *          we just put a zero.
 * 
 * @param {StorageContent} val 
 */
async function MIGR003_addSolvedFlag(val) {
    /* Version key check */
    const VERSION_KEY = 2;
    if (val.versionKey >= VERSION_KEY) {
        return;
    }
    val.versionKey = VERSION_KEY;

    /* Updater */
    for (const entry of val.entries) {
        entry.state.elapsed = 0;
    }
}