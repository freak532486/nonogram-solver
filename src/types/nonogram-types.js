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
     * Cell states.
     * @type {Array<CellKnowledge>}
     */
    #cells;

    /**
     * Creates an empty board.
     * @param {number} width 
     * @param {number} height 
     */
    constructor (width, height) {
        this.#width = width;
        this.#height = height;
        this.#cells = Array(width * height).fill(CellKnowledge.UNKNOWN);
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
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
};

export class NonogramInput {
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
     * Current state of the nonogram.
     * @type {NonogramState}
     */
    #curState;

    /**
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints
     * @param {NonogramState} state
     */
    constructor (rowHints, colHints, state) {
        if (state.width != colHints.length || state.height != rowHints.length) {
            throw new Error("Number of hints does not match the size of the board.");
        }

        this.#rowHints = rowHints;
        this.#colHints = colHints;
        this.#curState = state;
    }

    /**
     * Creates a nonogram input with hints and an empty board.
     * 
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints
     */
    static withEmptyBoard(rowHints, colHints) {
        return new NonogramInput(rowHints, colHints, new NonogramState(colHints.length, rowHints.length));
    }

    /**
     * Creates a nonogram input with hints and an existing board state.
     * 
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints
     * @param {NonogramState} state
     */
    static withExistingState(rowHints, colHints, state) {
        return new NonogramInput(rowHints, colHints, state);
    }

    get width() {
        return this.#curState.width;
    }

    get height() {
        return this.#curState.height;
    }

    get rowHints() {
        return this.#rowHints;
    }

    get colHints() {
        return this.#colHints;
    }

    get state() {
        return this.#curState;
    }
};

/**
 * Flags for deduction result.
 * @enum {number}
 */
export const DeductionFlags = Object.freeze({
    /**
     * If this bit is set, a deduction was made.
     * If this bit is not set and the nonogram is neither solved nor impossible, the solver is not sure what to do.
     */
    BIT_DEDUCTION_MADE: 0x0001,

    /**
     * If this bit is set, then the nonogram is solved. If no deduction was made, the nonogram was already solved.
     */
    BIT_SOLVED: 0x0010,

    /**
     * If this bit is set, then the nonogram is impossible.
     */
    BIT_IMPOSSIBLE: 0x0100
});

export class SingleDeductionResult {
    /**
     * Status flags for this deduction.
     * @type {DeductionFlags}
     */
    #statusFlags;

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
     * @param {DeductionFlags} statusFlags 
     * @param {LineId | null} lineId 
     * @param {LineKnowledge | null} newKnowledge 
     */
    constructor (statusFlags, lineId, newKnowledge) {
        const hasLineId = lineId != null;
        const hasKnowledge = newKnowledge != null;

        if (hasLineId !== hasKnowledge) {
            throw new Error("Either both are supplied or none");
        }

        this.#statusFlags = statusFlags;
        this.#lineId = lineId;
        this.#newKnowledge = newKnowledge;
    }

    /**
     * Creates a "nothing was deduced" deduction result.
     */
    static noDeduction() {
        return new SingleDeductionResult(0, null, null);
    }

    get statusFlags() {
        return this.#statusFlags;
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