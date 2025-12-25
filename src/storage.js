import * as dynamicUi from "./dynamic-ui.js"
import * as global from "./global.js"
import * as inputParsing from "./input-parsing.js"
import { CellKnowledge } from "./types/nonogram-types.js";

const STORAGE_KEY = "storage";
const DEFAULT_STATE_KEY = "(Default)";

let initialized = false;

export function init() {
    /* Initialize only once. */
    if (initialized) {
        return;
    }

    initialized = true;

    /* Create default state and store */
    const defaultState = new SerializedState();
    defaultState.key = DEFAULT_STATE_KEY;
    defaultState.numRows = 5;
    defaultState.numCols = 5;
    defaultState.rowHints = "";
    defaultState.colHints = "";
    defaultState.prefill = "";
    defaultState.state = "";

    storeState(defaultState, Location.TOP);
}

/**
 * Stores the current global state in browser storage with the given key.
 * 
 * @param {string} key
 */
export function storeCurrentState(key) {
    /* Create serializable state from global state */
    const toStore = new SerializedState();

    toStore.key = key;
    toStore.numRows = global.getUserInput().numRows;
    toStore.numCols = global.getUserInput().numCols;
    toStore.rowHints = global.inputRowHints.value;
    toStore.colHints = global.inputColHints.value;
    toStore.prefill = global.inputPrefill.value;
    toStore.state = "";

    /* Build state from nonogram state */
    for (let row = 0; row < global.getSolverInput().height; row++) {
        for (let col = 0; col < global.getSolverInput().width; col++) {
            const knowledge = global.getSolverInput().state.getCell(col, row);

            switch (knowledge) {
                case CellKnowledge.UNKNOWN:
                    toStore.state += ".";
                    break;
                
                case CellKnowledge.DEFINITELY_WHITE:
                    toStore.state += "X";
                    break;
                
                case CellKnowledge.DEFINITELY_BLACK:
                    toStore.state += "#";
                    break;

                default:
                    throw new Error("Impossible case");
            }
        }

        toStore.state += "\n";
    }

    /* Store state */
    storeState(toStore);
}

/**
 * @enum {number}
 */
const Location = Object.freeze({
    BOTTOM: 0,
    TOP: 1
})

/**
 * Stores the given state into browser storage.
 * 
 * @param {SerializedState} state
 * @param {Location} location
 */
function storeState(state, location = Location.BOTTOM) {
    const storage = getCurrentStorage();

    /* Check if key already exists. Replace if true */
    storage.states = storage.states.filter(x => x.key != state.key);

    /* Store and save */
    if (location == Location.TOP) {
        storage.states.unshift(state);
    } else {
        storage.states.push(state);
    }
    replaceStorage(storage);
    refreshStorageUI();
}

/**
 * Applies the stored input to the global state.
 * 
 * @param {string} key 
 */
export function applyStoredInput(key) {
    const storage = getCurrentStorage();

    const state = storage.states.find(state => state.key == key) ?? null;
    if (state == null) {
        throw new Error("State with key " + key + " does not exist.");
    }

    /* Apply state (except solver state) */
    global.inputNumRows.value = String(state.numRows);
    global.inputNumCols.value = String(state.numCols);
    global.inputRowHints.value = state.rowHints;
    global.inputColHints.value = state.colHints;
    global.inputPrefill.value = state.prefill;

    /* Recalulate state */
    inputParsing.updateInputState();
    dynamicUi.resizeTextAreas();
    dynamicUi.rebuildNonogramContainer();

    /* Apply stored solver state */
    const lines = state.state.split("\n");
    for (var row = 0; row < global.getSolverInput().height; row++) {
        for (var col = 0; col < global.getSolverInput().width; col++) {
            const symbol = lines[row].charAt(col);

            switch (symbol) {
                case '#':
                    global.getSolverInput().state.updateCell(col, row, CellKnowledge.DEFINITELY_BLACK);
                    break;

                case 'X':
                    global.getSolverInput().state.updateCell(col, row, CellKnowledge.DEFINITELY_WHITE);
                    break;

                case '.':
                    global.getSolverInput().state.updateCell(col, row, CellKnowledge.UNKNOWN);
                    break;

                default:
                    throw new Error("Impossible case");
            }
        }
    }
}

/**
 * Removes a stored storage entry from storage.
 * 
 * @param {string} key 
 */
export function deleteStoredState(key) {
    /* Cannot delete default state */
    if (key == DEFAULT_STATE_KEY) {
        return;
    }

    /* Remove state */
    const storage = getCurrentStorage();
    storage.states = storage.states.filter(state => state.key != key);
    replaceStorage(storage);
}

/**
 * Refreshes the list of stored keys.
 */
export function refreshStorageUI() {
    const keys = getAllStoredInputKeys();
    const elements = keys.map(key => {
        const ret = document.createElement("option");
        ret.value = key;
        ret.textContent = key;
        return ret;
    });
    global.storageList.replaceChildren(...elements);
}

/**
 * Returns the current deserialized storage content.
 * 
 * @returns {StorageContent}
 */
function getCurrentStorage() {
    const rawStorage = window.localStorage.getItem(STORAGE_KEY);
    return rawStorage == null ? new StorageContent() : new StorageContent(JSON.parse(rawStorage));
}

/**
 * Replaces the stored states with the given storage.
 * 
 * @param {StorageContent} storage 
 */
function replaceStorage(storage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    refreshStorageUI();
}

/**
 * Returns list of all stored inputs.
 * 
 * @returns {Array<string>}
 */
function getAllStoredInputKeys() {
    const storage = window.localStorage.getItem(STORAGE_KEY);
    if (storage == null) {
        return [];
    }

    const parsed = new StorageContent(JSON.parse(storage));
    return parsed.states.map(state => state.key);
}

class StorageContent {
    /** @type {Array<SerializedState>} */ states = [];

    /**
     * Creates instance from deserialized JSON.
     * 
     * @param {any | null} raw 
     */
    constructor(raw = null) {
        if (raw != null) {
            Object.assign(this, raw);
        }
    }
}

class SerializedState {
    /** @type{string} */ key = "";
    /** @type{number} */ numRows = 0;
    /** @type{number} */ numCols = 0;
    /** @type{string} */ rowHints = "";
    /** @type{string} */ colHints = "";
    /** @type{string} */ prefill = "";
    /** @type{string} */ state = "";

};