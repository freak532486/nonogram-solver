import { CellKnowledge } from "./nonogram-types";

export class SerializedNonogram {
    /**
     * @param {String} id
     * @param {Array<Array<Number>>} rowHints 
     * @param {Array<Array<Number>>} colHints 
     */
    constructor (id, rowHints, colHints) {
        this.id = id;
        this.rowHints = rowHints;
        this.colHints = colHints;
    }
};

export class StorageContent {
    /** @type {number} */
    versionKey = 1;

    /** @type {Array<StorageEntry>} */
    entries = [];

    /** @type {string | undefined} */
    lastPlayedNonogramId;
};

export class StorageEntry {
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
     * @param {number} elapsed
     */
    constructor(cells, elapsed) {
        this.cells = cells;
        this.elapsed = elapsed;
    }
}