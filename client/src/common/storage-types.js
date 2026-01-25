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