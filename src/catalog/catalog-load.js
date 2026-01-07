class JoinedFiletype {
    /** @type {Array<SerializedNonogram>} */
    nonograms = [];
}

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

/**
 * Fetches all stored nonograms and returns them.
 * 
 * @returns {Promise<Array<SerializedNonogram>>}
 */
export async function loadNonograms() {
    const serialized = await fetch("/nonograms/joined.json");
    const joined = /** @type {JoinedFiletype} */ (JSON.parse(await serialized.text()));
    return joined.nonograms;
}