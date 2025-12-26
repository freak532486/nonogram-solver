
/**
 * Contains parsed data of all input fields (size, hints...)
 */
export class AppState {

    /**
     * @type {number}
     */
    #numRows;

    /**
     * @type {number}
     */
    #numCols;

    /**
     * Raw row hints text.
     * @type {string}
     */
    #rawRowHints = "";

    /**
     * List of row hints. Its length is always equal to 'numRows'.
     * @type {Array<Array<number>>}
     */
    #rowHints = [];

    /**
     * Error message for row hints.
     * @type {string}
     */
    #rowHintsErr = "";

    /**
     * Raw column hints text.
     * @type {string}
     */
    #rawColHints = "";

    /**
     * List of column hints. Its length is always equal to 'numCols'.
     * @type {Array<Array<number>>}
     */
    #colHints = [];

    /**
     * Error message for column hints.
     * @type {string}
     */
    #colHintsErr = "";

    /**
     * Creates the initial user input state.
     * 
     * @param {number} numRows 
     * @param {number} numColums 
     */
    constructor(numRows, numColums) {
        this.#numRows = numRows;
        this.#numCols = numColums;
        this.#sanitizeHints();
    }

    /**
     * Makes sure that the invariant '#rowHints.length == numRows' (vice versa for columns) holds. Fills missing hints
     * with zeroes.
     */
    #sanitizeHints() {
        /* Sanitize row hints */
        this.#rowHints = this.#rowHints.slice(0, this.numRows);
        while (this.#rowHints.length < this.numRows) {
            this.#rowHints.push([ 0 ]);
        }

        /* Sanitize column hints */
        this.#colHints = this.#colHints.slice(0, this.numCols);
        while (this.#colHints.length < this.numCols) {
            this.#colHints.push([ 0 ]);
        }
    }

    get numRows() {
        return this.#numRows;
    }

    get numCols() {
        return this.#numCols;
    }

    get rawRowHints() {
        return this.#rawRowHints;
    }

    get rowHints() {
        return this.#rowHints;
    }

    get rowHintsErr() {
        return this.#rowHintsErr;
    }

    get rawColHints() {
        return this.#rawColHints;
    }

    get colHints() {
        return this.#colHints;
    }

    get colHintsErr() {
        return this.#colHintsErr;
    }

    set numRows(numRows) {
        this.#numRows = numRows;
        this.#sanitizeHints();
    }

    set numCols(numCols) {
        this.#numCols = numCols;
        this.#sanitizeHints();
    }

    set rawRowHints(rawRowHints) {
        this.#rawRowHints = rawRowHints;
    }

    set rowHints(rowHints) {
        this.#rowHints = rowHints;
        this.#sanitizeHints();
    }

    set rowHintsErr(rowHintsErr) {
        this.#rowHintsErr = rowHintsErr;
    }

    set rawColHints(rawColHints) {
        this.#rawColHints = rawColHints;
    }

    set colHints(colHints) {
        this.#colHints = colHints;
        this.#sanitizeHints();
    }

    set colHintsErr(colHintsErr) {
        this.#colHintsErr = colHintsErr;
    }


};
