/**
 * Contains parsed data of all input fields (size, hints...)
 */
export class InputData {

    /**
     * @type {number}
     */
    #numRows = 0;

    /**
     * @type {number}
     */
    #numCols = 0;

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

    get rowHints() {
        return this.#rowHints;
    }

    get rowHintsErr() {
        return this.#rowHintsErr;
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

    set rowHints(rowHints) {
        this.#rowHints = rowHints;
        this.#sanitizeHints();
    }

    set rowHintsErr(rowHintsErr) {
        this.#rowHintsErr = rowHintsErr;
    }

    set colHints(colHints) {
        this.#colHints = colHints;
        this.#sanitizeHints();
    }

    set colHintsErr(colHintsErr) {
        this.#colHintsErr = colHintsErr;
    }


};
