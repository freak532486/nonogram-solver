import { CellKnowledge } from "./common/nonogram-types.js";
import { SaveState, StorageContent, StorageEntry } from "./common/storage-types.js";

/* Storage is versioned if there are breaking changes to storage layout */
export const STORAGE_KEY = "storage";
export const STORAGE_VERSION = "V0.04";

/**
 * Retrieves the stored state for the given nonogram, if any.
 * 
 * @param {string} nonogramId 
 * @returns {SaveState | null}
 */
export function retrieveStoredState(nonogramId) {
    const storage = fetchStorage();

    return storage.entries.find(entry => entry.nonogramId == nonogramId)?.state ?? null;
}


/**
 * @returns {Map<string, SaveState>}
 */
export function fetchAllStoredStates() {
    const storage = fetchStorage();
    const ret = new Map();
    storage.entries.forEach(entry => ret.set(entry.nonogramId, entry.state));
    return ret;
}


/**
 * @param {string} nonogramId 
 * @param {SaveState} state 
 */
export function storeState(nonogramId, state) {
    const storage = fetchStorage();
    const matchingEntry = storage.entries.find(entry => entry.nonogramId == nonogramId);

    if (matchingEntry) {
        matchingEntry.state = state;
    } else {
        storage.entries.push(new StorageEntry(nonogramId, state));
    }

    putStorage(storage);
}

/**
 * Loads storage contents.
 * 
 * @returns {StorageContent}
 */
export function fetchStorage() {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
        return new StorageContent();
    }

    return JSON.parse(serialized);
}

/**
 * Writes new storage contents.
 * 
 * @param {StorageContent} storage 
 */
export function putStorage(storage) {
    const serialized = JSON.stringify(storage);
    window.localStorage.setItem(STORAGE_KEY, serialized);
}