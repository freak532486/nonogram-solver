/**
 * Type of a line
 * @enum {number}
 */
export const LineType = Object.freeze({
    ROW: 0,
    COLUMN: 1
});

/**
 * Identifier for a line
 */
export class LineId {
    /**
     * Type of line
     * @type {!LineType}
     */
    #lineType;

    /**
     * Index of the line
     * @type {number}
     */
    #index;

    /**
     * @param {!LineType} lineType 
     * @param {number} index 
     */
    constructor (lineType, index) {
        this.#lineType = lineType;
        this.#index = index;
    }

    get lineType() {
        return this.#lineType;
    }

    get index() {
        return this.#index;
    }

    /**
     * @returns {string}
     */
    toString() {
        // One-indexed for human readability
        return `${this.#lineType == LineType.ROW ? "row" : "column"} ${this.#index + 1}`;
    }

    /**
     * Compares two line ids.
     * 
     * @param {LineId} other 
     * @returns {boolean}
     */
    equals(other) {
        return this.index == other.index && this.lineType == other.lineType;
    }
};

/**
 * Current knowledge about a nonogram cell.
 * @enum {number}
 */
export const CellKnowledge = Object.freeze({
    UNKNOWN: 0,
    DEFINITELY_WHITE: 1,
    DEFINITELY_BLACK: 2
});

/**
 * Knowledge data for a single line.
 */
export class LineKnowledge {
    /**
     * Knowledge array for each cell.
     * @type {Array<CellKnowledge>}
     */
    #cells;

    /**
     * @param {Array<CellKnowledge>} cells 
     */
    constructor (cells) {
        this.#cells = cells;
    }

    get cells() {
        return this.#cells;
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        let ret = "";
        for (const cellKnowledge of this.#cells) {
            switch (cellKnowledge) {
                case CellKnowledge.DEFINITELY_BLACK: ret += "#"; break;
                case CellKnowledge.DEFINITELY_WHITE: ret += " "; break;
                case CellKnowledge.UNKNOWN: ret += "?"; break;
            }
        }
        return ret;
    }
}

export class NonogramState {
    /**
     * Width of the nonogram
     * @type {number}
     */
    #width;
    
    /**
     * Height of the nonogram.
     * @type {number}
     */
    #height;

    /**
     * All available row hints.
     * @type {Array<Array<number>>}
     */
    #rowHints;

    /**
     * All available column hints.
     * @type {Array<Array<number>>}
     */
    #colHints;

    /**
     * Cell states.
     * @type {Array<CellKnowledge>}
     */
    #cells;

    /**
     * Creates an empty board.
     * @param {number} width 
     * @param {number} height
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints
     * @param {Array<CellKnowledge>} cells
     * 
     */
    constructor (width, height, rowHints, colHints, cells) {
        this.#width = width;
        this.#height = height;
        this.#rowHints = rowHints;
        this.#colHints = colHints;
        this.#cells = cells;
    }

    /**
     * Creates an empty nonogram board state.
     * 
     * @param {number} width 
     * @param {number} height
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints
     * @returns {NonogramState}
     */
    static empty(width, height, rowHints, colHints) {
        const cells = Array(width * height).fill(CellKnowledge.UNKNOWN);
        return new NonogramState(width, height, rowHints, colHints, cells);
    }

    /**
     * Clones an existing nonogram board state.
     * 
     * @param {NonogramState} state 
     * @returns {NonogramState}
     */
    static clone(state) {
        return new NonogramState(state.width, state.height, state.rowHints, state.colHints, [...state.#cells]);
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get rowHints() {
        return this.#rowHints;
    }

    get colHints() {
        return this.#colHints;
    }

    /**
     * Returns the knowledge of the cell at the given location.
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {CellKnowledge}
     */
    getCell(x, y) {
        return this.#cells[x + y * this.#width];
    }

    /**
     * Updates the knowledge state of a cell.
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {CellKnowledge} knowledge 
     */
    updateCell(x, y, knowledge) {
        this.#cells[x + y * this.#width] = knowledge;
    }

    /**
     * Returns the line knowledge for the requested row.
     * 
     * @param {number} row
     * @returns {LineKnowledge} 
     */
    getRowKnowledge(row) {
        if (row < 0 || row >= this.height) {
            throw new Error("Row " + row + " does not exist.");
        }

        const cells = Array(this.width);
        for (let x = 0; x < this.width; x++) {
            cells[x] = this.getCell(x, row);
        }

        return new LineKnowledge(cells);
    }

    /**
     * Returns the line knowledge for the requested column.
     * 
     * @param {number} col
     * @returns {LineKnowledge} 
     */
    getColKnowledge(col) {
        if (col < 0 || col >= this.width) {
            throw new Error("Column " + col + " does not exist.");
        }

        const cells = Array(this.height);
        for (let y = 0; y < this.height; y++) {
            cells[y] = this.getCell(col, y);
        }

        return new LineKnowledge(cells);
    }

    /**
     * Applies a deduction to this state.
     * 
     * @param {SingleDeductionResult} deduction 
     */
    applyDeduction(deduction) {
        if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
            return;
        }

        if (deduction.lineId.lineType == LineType.ROW) {
            for (let x = 0; x < this.#width; x++) {
                this.updateCell(x, deduction.lineId.index, deduction.newKnowledge.cells[x]);
            }
        } else {
            for (let y = 0; y < this.#height; y++) {
                this.updateCell(deduction.lineId.index, y, deduction.newKnowledge.cells[y]);
            }
        }
    }

    getCellStates() {
        return this.#cells;
    }
};

/**
 * Flags for deduction result.
 * @enum {number}
 */
export const DeductionStatus = Object.freeze({
    COULD_NOT_DEDUCE: 0,
    DEDUCTION_MADE: 1,
    WAS_IMPOSSIBLE: 2,
    WAS_SOLVED: 3,
    TIMEOUT: 4
});

export class FullDeductionResult {
    /**
     * Status flags for this deduction.
     * @type {DeductionStatus}
     */
    status;

    /**
     * New solved state (or last before proof of impossibility)
     * @type {NonogramState}
     */
    newState;

    /**
     * @param {DeductionStatus} status 
     * @param {NonogramState} newState 
     */
    constructor (status, newState) {
        this.status = status;
        this.newState = newState;
    }
}

export class SingleDeductionResult {
    /**
     * Status flags for this deduction.
     * @type {DeductionStatus}
     */
    #status;

    /**
     * Line for which a deduction was made
     * @type {LineId | null}
     */
    #lineId;

    /**
     * New knowledge for the line.
     * @type {LineKnowledge | null}
     */
    #newKnowledge;

    /**
     * 
     * @param {DeductionStatus} statusFlags 
     * @param {LineId | null} lineId 
     * @param {LineKnowledge | null} newKnowledge 
     */
    constructor (statusFlags, lineId, newKnowledge) {
        const hasLineId = lineId != null;
        const hasKnowledge = newKnowledge != null;

        if (hasLineId !== hasKnowledge) {
            throw new Error("Either both are supplied or none");
        }

        this.#status = statusFlags;
        this.#lineId = lineId;
        this.#newKnowledge = newKnowledge;
    }

    /**
     * Creates a "nothing was deduced" deduction result.
     * 
     * @returns {SingleDeductionResult}
     */
    static noDeduction() {
        return new SingleDeductionResult(0, null, null);
    }

    /**
     * Creates a "state was impossible" deduction result.
     * 
     * @returns {SingleDeductionResult}
     */
    static impossible() {
        return new SingleDeductionResult(DeductionStatus.WAS_IMPOSSIBLE, null, null);
    }

    get status() {
        return this.#status;
    }

    get lineId() {
        if (!this.#lineId) {
            throw new Error("No deduction was made.");
        }

        return this.#lineId;
    }

    get newKnowledge() {
        if (!this.#newKnowledge) {
            throw new Error("No deduction was made.");
        }

        return this.#newKnowledge;
    }
}