import { CellKnowledge } from "./common/nonogram-types.js";

/* Storage is versioned if there are breaking changes to storage layout */
const STORAGE_KEY = "storage_v0.03"

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


class StorageContent {
    /** @type {Array<StorageEntry>} */
    entries = [];
};

class StorageEntry {
    /**
     * @param {string} nonogramId 
     * @param {SaveState} state 
     */
    constructor (nonogramId, state) {
        this.nonogramId = nonogramId;
        this.state = state;
    }
}

export class SaveState {
    /**
     * @param {Array<CellKnowledge>} cells 
     */
    constructor(cells) {
        this.cells = cells;
    }
}

/**
 * Loads storage contents.
 * 
 * @returns {StorageContent}
 */
function fetchStorage() {
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
function putStorage(storage) {
    const serialized = JSON.stringify(storage);
    window.localStorage.setItem(STORAGE_KEY, serialized);
}