import { LineId, LineType } from "./nonogram-types";

export class LineIdSet
{
    #rows = /** @type {Set<number>} */ (new Set());
    #cols = /** @type {Set<number>} */ (new Set());

    /**
     * Adds a line to the set.
     * 
     * @param {LineId} lineId 
     */
    add(lineId) {
        const relevantSet = lineId.lineType == LineType.ROW ? this.#rows : this.#cols;
        relevantSet.add(lineId.index);
    }

    /**
     * Removes a line from the set.
     * 
     * @param {LineId} lineId 
     */
    remove(lineId) {
        const relevantSet = lineId.lineType == LineType.ROW ? this.#rows : this.#cols;
        relevantSet.delete(lineId.index);
    }

    /**
     * Checks if a line is contained in this set.
     * 
     * @param {LineId} lineId 
     * @returns {boolean}
     */
    has(lineId) {
        const relevantSet = lineId.lineType == LineType.ROW ? this.#rows : this.#cols;
        return relevantSet.has(lineId.index);
    }

    /**
     * @returns {Array<LineId>}
     */
    asArray() {
        const ret = /** @type {Array<LineId>} */ ([]);
        this.#rows.forEach(idx => ret.push(new LineId(LineType.ROW, idx)));
        this.#cols.forEach(idx => ret.push(new LineId(LineType.COLUMN, idx)));
        return ret;
    }

    /**
     * Returns the current size of the set.
     * 
     * @returns {number}
     */
    get size() {
        return this.#rows.size + this.#cols.size;
    }
}