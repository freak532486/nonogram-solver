import { BoardComponentFullState } from "./playfield/nonogram-board/nonogram-board.component.js";



/**
 * Retrieves the stored state for the given nonogram, if any.
 * 
 * @param {number} nonogramId 
 * @returns {BoardComponentFullState | null}
 */
export function retrieveStoredState(nonogramId) {
    const storage = fetchStorage();
    return storage.entries.find(entry => entry.nonogramId == nonogramId)?.state ?? null;
}



/**
 * @returns {Map<number, BoardComponentFullState>}
 */
export function fetchAllStoredStates() {
    const storage = fetchStorage();
    const ret = new Map();
    storage.entries.forEach(entry => ret.set(entry.nonogramId, entry.state));
    return ret;
}



/**
 * @param {number} nonogramId 
 * @param {BoardComponentFullState} state 
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
     * @param {number} nonogramId 
     * @param {BoardComponentFullState} state 
     */
    constructor (nonogramId, state) {
        this.nonogramId = nonogramId;
        this.state = state;
    }
}

/**
 * Loads storage contents.
 * 
 * @returns {StorageContent}
 */
function fetchStorage() {
    const serialized = window.localStorage.getItem("storage");
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
    window.localStorage.setItem("storage", serialized);
}