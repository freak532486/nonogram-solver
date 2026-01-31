import { CellKnowledge, LineId, LineKnowledge, LineType } from "../../common/nonogram-types.js";
import { Point } from "../../common/point.js";
import { deepArraysEqual } from "../../util.js";

import "./nonogram-board.css"

const COLOR_BADLINE = "#c27676ff"
const COLOR_SELECTION = "#aedbff"

export class BoardComponentFullState {

    /**
     * 
     * @param {Array<CellKnowledge>} cells
     * @param {Array<Array<number>>} finishedRowHints
     * @param {Array<Array<number>>} finishedColHints
     * @param {Array<LineId>} errorLines
     */
    constructor (cells, finishedRowHints, finishedColHints, errorLines) {
        this.cells = cells;
        this.finishedRowHints = finishedRowHints;
        this.finishedColHints = finishedColHints;
        this.errorLines = errorLines;
    }

    /**
     * Creates an empty state
     * 
     * @param {number} width 
     * @param {number} height 
     * @returns {BoardComponentFullState}
     */
    static empty(width, height) {
        return new BoardComponentFullState(
            Array(width * height).fill(CellKnowledge.UNKNOWN),
            Array(height).fill(null).map(() => []),
            Array(width).fill(null).map(() => []),
            []
        );
    }

    /**
     * Returns 'true' if this state is equal to some other state
     * 
     * @param {BoardComponentFullState} other
     * @returns {boolean}
     */
    equals(other) {
        return deepArraysEqual(this.cells, other.cells) &&
            deepArraysEqual(this.finishedRowHints, other.finishedRowHints) &&
            deepArraysEqual(this.finishedColHints, other.finishedColHints) &&
            deepArraysEqual(this.errorLines, other.errorLines);
    }
}

export class NonogramBoardComponent {

    /**
     * @type {number}
     */
    #width;

    /**
     * @type {number}
     */
    #height;

    /**
     * @type {Array<Array<number>>}
     */
    #rowHints;

    /**
     * @type {Array<Array<number>>}
     */
    #finishedRowHints;

    /**
     * @type {Array<Array<number>>}
     */
    #colHints;

    /**
     * @type {Array<Array<number>>}
     */
    #finishedColHints;

    /**
     * @type {Array<HTMLElement>}
     */
    #rowHintDivs;

    /**
     * @type {Array<HTMLElement>}
     */
    #colHintDivs;

    /**
     * @type {Array<HTMLElement>}
     */
    #cellDivs;

    /** @type {HTMLElement} */
    #cellBlackTemplate;

    /** @type {HTMLElement} */
    #cellWhiteTemplate; 

    #selection = new Point();
    #selectionDiv = document.createElement("div");

    /**
     * @type {HTMLElement}
     */
    #view

    /** @type {Array<CellKnowledge>} */
    #state;

    #errorLines = /** @type {Array<LineId>} */ ([]);

    #clickListener = /** @type {(p: Point) => void} */ () => {};

    /**
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints 
     */
    constructor (rowHints, colHints) {
        /* Copy data */
        const width = colHints.length;
        const height = rowHints.length;

        this.#width = width;
        this.#height = height;
        this.#rowHints = rowHints;
        this.#colHints = colHints;

        this.#finishedRowHints = Array(height).fill(null).map(() => []);
        this.#finishedColHints = Array(width).fill(null).map(() => []);

        this.#state = Array(width * height).fill(CellKnowledge.UNKNOWN);

        /* Create templates */
        this.#cellBlackTemplate = document.createElement("div");
        this.#cellBlackTemplate.classList.add("cell-black");

        this.#cellWhiteTemplate = document.createElement("span");
        this.#cellWhiteTemplate.classList.add("cell-white");
        this.#cellWhiteTemplate.textContent = "X";

        /* Create row hint divs */
        this.#rowHintDivs = [];
        for (let row = 0; row < height; row++) {
            /* Create hint container */
            const div = document.createElement("div");
            div.classList.add("hint-div-container", "row");

            div.style.borderTop = (row == 0) ? "2px solid black" : "none";
            div.style.borderBottom = (row % 5 == 4) ? "2px solid black" : "1px solid black";
            div.style.borderLeft = "2px solid black";

            /* Add hints to container. Empty hints should be displayed as a single zero. */
            const hintsWithZero = rowHints[row].length == 0 ? [0] : rowHints[row];
            for (const hint of hintsWithZero) {
                const hintDiv = document.createElement("div");
                hintDiv.classList.add("hint", "row");
                hintDiv.textContent = String(hint);

                div.appendChild(hintDiv);
            }

            this.#rowHintDivs.push(div);
        }

        /* Create column hint divs */
        this.#colHintDivs = [];
        for (let col = 0; col < width; col++) {
            /* Create hint container */
            const div = document.createElement("div");
            div.classList.add("hint-div-container", "column");

            div.style.borderLeft = (col == 0) ? "2px solid black" : "none";
            div.style.borderRight = (col % 5 == 4) ? "2px solid black" : "1px solid black";
            div.style.borderTop = "2px solid black";

            /* Add hints to container. Empty hints should be displayed as a single zero. */
            const hintsWithZero = colHints[col].length == 0 ? [0] : colHints[col];
            for (const hint of hintsWithZero) {
                const hintDiv = document.createElement("div");
                hintDiv.classList.add("hint", "column");
                hintDiv.textContent = String(hint);

                div.appendChild(hintDiv);
            }

            this.#colHintDivs.push(div);
        }

        /* Create cells */
        this.#cellDivs = [];
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const div = document.createElement("div");
                div.classList.add("cell");

                div.style.borderLeft = (col == 0) ? "2px solid black" : "none";
                div.style.borderTop = (row == 0) ? "2px solid black" : "none";
                div.style.borderRight = (col % 5 == 4) ? "2px solid black" : "1px solid black";
                div.style.borderBottom = (row % 5 == 4) ? "2px solid black" : "1px solid black";

                div.onclick = () => {
                    this.selection = new Point(col, row);
                    this.#clickListener(new Point(col, row));
                };

                this.#cellDivs.push(div);
            }
        }

        /* Create selection element */
        this.#selectionDiv.classList.add("selection-cursor");

        /* Create root element */
        const view = document.createElement("div");
        view.id = "nonogram-board";
        view.style.gridTemplateRows = `max-content repeat(${height}, auto)`;
        view.style.gridTemplateColumns = `max-content repeat(${width}, auto)`;
    

        /* Layout and add children to root */
        for (let row = 0; row < height; row++) {
            const div = this.#rowHintDivs[row];

            div.style.gridRow = String(row + 2);
            div.style.gridColumn = "1";

            view.appendChild(div);
        }

        for (let col = 0; col < width; col++) {
            const div = this.#colHintDivs[col];

            div.style.gridRow = "1";
            div.style.gridColumn = String(col + 2);

            view.appendChild(div);
        }

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const div = this.#getCellDiv(col, row);

                div.style.gridRow = String(row + 2);
                div.style.gridColumn = String(col + 2);

                view.appendChild(div);
            }
        }

        view.appendChild(this.#selectionDiv);
        this.#view = view;
    }

    /**
     * Initializes and attaches this component
     * 
     * @param {HTMLElement} parent 
     */
    init(parent) {
        parent.append(this.view);

        /* Move selection to top-left corner */
        this.selection = new Point(0, 0);
    }

    /**
     * Returns this components root element.
     */
    get view() {
        return this.#view;
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
     * @returns {Point}
     */
    get selection() {
        return this.#selection;
    }

    /**
     * @param {Point} p
     */
    set selection(p) {
        p.x = Math.max(0, Math.min(this.#width - 1, p.x));
        p.y = Math.max(0, Math.min(this.#height - 1, p.y));
        this.#selection = p;

        /* Update selection div */
        if (p == null) {
            this.#selectionDiv.style = "hidden";
            return;
        }

        const cellDiv = this.#getCellDiv(p.x, p.y);

        const style = getComputedStyle(cellDiv);
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const borderTop = parseFloat(style.borderTopWidth) || 0;

        this.#selectionDiv.style.left = (cellDiv.offsetLeft + borderLeft) + "px";
        this.#selectionDiv.style.top = (cellDiv.offsetTop + borderTop) + "px";
        
        /* Highlight hints */
        this.#updateHintDivDisplay();
    }

    /**
     * Moves the selection by the given offset. Does nothing if the selection is hidden.
     * 
     * @param {number} dx 
     * @param {number} dy 
     */
    moveSelection(dx, dy) {
        if (!this.selection) {
            return;
        }

        this.selection = new Point(this.selection.x + dx, this.selection.y + dy);
    }

    /**
     * Returns the cell div for the cell at the given location.
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {HTMLElement}
     */
    #getCellDiv(x, y) {
        return this.#cellDivs[x + y * this.#width];
    }

    /**
     * Returns the current state of a cell.
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {CellKnowledge}
     */
    getCellState(x, y) {
        return this.#state[x + y * this.#width];
    }

    /**
     * Sets the state of a cell.
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {CellKnowledge} state 
     */
    setCellState(x, y, state) {
        this.#state[x + y * this.#width] = state;
        
        const div = this.#getCellDiv(x, y);

        switch (state) {
            case CellKnowledge.UNKNOWN:
                div.replaceChildren();
                break;

            case CellKnowledge.DEFINITELY_WHITE:
                div.replaceChildren(this.#cellWhiteTemplate.cloneNode(true));
                break;

            case CellKnowledge.DEFINITELY_BLACK:
                div.replaceChildren(this.#cellBlackTemplate.cloneNode(true));
                break;
        }
    }

    /**
     * Switches the given cell to the "next" cell state.
     * 
     * @param {number} x 
     * @param {number} y 
     */
    toggleCellState(x, y) {
        const cur = this.getCellState(x, y);
        
        switch (cur) {
            case CellKnowledge.UNKNOWN:
                this.setCellState(x, y, CellKnowledge.DEFINITELY_BLACK);
                break;

            case CellKnowledge.DEFINITELY_BLACK:
                this.setCellState(x, y, CellKnowledge.DEFINITELY_WHITE);
                break;

            case CellKnowledge.DEFINITELY_WHITE:
                this.setCellState(x, y, CellKnowledge.UNKNOWN);
                break;
        }
    }

    /**
     * Returns the full state of this board. Can be applied again later.
     * 
     * @returns {BoardComponentFullState}
     */
    getFullState() {
        return new BoardComponentFullState(
            [...this.#state],
            this.#finishedRowHints.map(arr => [...arr]),
            this.#finishedColHints.map(arr => [...arr]),
            [...this.#errorLines]
        );
    }

    /**
     * Applies a full state to this board.
     * 
     * @param {BoardComponentFullState} state 
     */
    applyState(state) {
        /* Apply cell states */
        const cells = state.cells;

        if (cells.length != this.#width * this.#height) {
            throw new Error("State has unexpected length");
        }

        for (let i = 0; i < cells.length; i++) {
            const x = i % this.#width;
            const y = Math.floor(i / this.#width);

            this.setCellState(x, y, cells[i]);
        }

        /* Apply finished row/column hints */
        if (state.finishedRowHints) {
            this.#finishedRowHints = state.finishedRowHints.map(arr => [...arr]);
        }

        if (state.finishedColHints) {
            this.#finishedColHints = state.finishedColHints.map(arr => [...arr]);
        }

        if (state.errorLines) {
            this.#errorLines = [...state.errorLines];
        }
        
        this.#updateHintDivDisplay();
    }

    /**
     * Sets the change listener that listens to any changes made to the board.
     * 
     * @param {() => void} listener 
     */
    setClickListener(listener) {
        this.#clickListener = listener;
    }

    /**
     * Clears the line preview.
     */
    clearLinePreview() {
        this.view.querySelectorAll(".line-preview").forEach(x => x.remove());
    }

    /**
     * Updates the preview for a line-to-be-drawn.
     * 
     * @param {Array<Point>} line
     * @param {CellKnowledge} lineType
     */
    updateLinePreview(line, lineType) {
        if (lineType == CellKnowledge.UNKNOWN) {
            throw new Error("Cannot draw preview line for unknown type");
        }

        const template = (lineType == CellKnowledge.DEFINITELY_BLACK) ? this.#cellBlackTemplate : 
            this.#cellWhiteTemplate;

        /* Remove previous preview */
        this.clearLinePreview();

        for (const p of line) {
            const cellDiv = this.#getCellDiv(p.x, p.y);

            /* Compute border width */
            const style = getComputedStyle(cellDiv);
            const borderLeft = parseFloat(style.borderLeftWidth) || 0;
            const borderTop = parseFloat(style.borderTopWidth) || 0;

            const div = document.createElement("div");
            div.classList.add("line-preview");
            div.style.position = "absolute";
            div.style.left = (cellDiv.offsetLeft + borderLeft) + "px";
            div.style.top = (cellDiv.offsetTop + borderTop) + "px";

            const child = /** @type {HTMLElement} */ (template.cloneNode(true));
            child.style.opacity = "0.5";
            div.replaceChildren(child);
            this.view.appendChild(div);
        }
    }

    /**
     * Updates the set of finished hints for a line.
     * 
     * @param {LineId} lineId 
     * @param {Array<number>} finishedHints 
     */
    updateFinishedHints(lineId, finishedHints) {
        const member = lineId.lineType == LineType.ROW ?
            this.#finishedRowHints :
            this.#finishedColHints;

        member[lineId.index] = finishedHints;
        this.#updateHintDivDisplay();
    }

    /**
     * Returns the current state of a given line.
     * 
     * @param {LineId} lineId 
     * @returns {LineKnowledge}
     */
    getLineState(lineId) {
        const lineLength = lineId.lineType == LineType.ROW ? this.width : this.height;
        const lineKnowledge = new LineKnowledge(Array(lineLength).fill(CellKnowledge.UNKNOWN));
        
        for (let i = 0; i < lineLength; i++) {
            const x = lineId.lineType == LineType.ROW ? i : lineId.index;
            const y = lineId.lineType == LineType.ROW ? lineId.index : i;

            lineKnowledge.cells[i] = this.getCellState(x, y);
        }

        return lineKnowledge;
    }

    /**
     * Marks a line either erroneous or not.
     * 
     * @param {LineId} lineId 
     * @param {boolean} isError
     */
    markError(lineId, isError) {
        removeIf(this.#errorLines, x => x.equals(lineId));
        if (isError) {
            this.#errorLines.push(lineId);
        }

        this.#updateHintDivDisplay();
    }

    /**
     * Marks error lines red, the selected line blue, and all other lines white. Crosses out finished hints.
     */
    #updateHintDivDisplay() {
        /* Rows */
        const errRows = /** @type {Set<number>} */ (new Set());
        this.#errorLines.filter(x => x.lineType == LineType.ROW).forEach(x => errRows.add(x.index));

        for (let y = 0; y < this.#height; y++) {
            const div = this.#rowHintDivs[y];

            /* Coloring */
            if (errRows.has(y)) {
                div.style.backgroundColor = COLOR_BADLINE;
            } else if (y == this.#selection.y) {
                div.style.backgroundColor = COLOR_SELECTION;
            } else {
                div.style.backgroundColor = "transparent";
            }

            /* Cross out finished hints */
            for (let i = 0; i < div.children.length; i++) {
                const child = /** @type {HTMLElement} */ (div.children[i]);
                child.classList.remove("crossed-out");

                if (this.#finishedRowHints[y].some(k => k == i)) {
                    child.classList.add("crossed-out");
                }
            }
        }

        /* Columns */
        const errCols = /** @type {Set<number>} */ (new Set());
        this.#errorLines.filter(x => x.lineType == LineType.COLUMN).forEach(x => errCols.add(x.index));

        for (let x = 0; x < this.#width; x++) {
            const div = this.#colHintDivs[x];

            /* Coloring */
            if (errCols.has(x)) {
                div.style.backgroundColor = COLOR_BADLINE;
            } else if (x == this.#selection.x) {
                div.style.backgroundColor = COLOR_SELECTION;
            }  else {
                div.style.backgroundColor = "transparent";
            }

            /* Cross out finished hints */
            for (let i = 0; i < div.children.length; i++) {
                const child = /** @type {HTMLElement} */ (div.children[i]);
                child.classList.remove("crossed-out");

                if (this.#finishedColHints[x].some(k => k == i)) {
                    child.classList.add("crossed-out");
                }
            }
        }
    }

    /**
     * Applies the given line knowledge to the given line in the state.
     * 
     * @param {LineId} lineId 
     * @param {LineKnowledge} lineKnowledge 
     */
    applyLineKnowledge(lineId, lineKnowledge) {
        const lineLength = lineId.lineType == LineType.ROW ? this.width : this.height;
        for (let i = 0; i < lineLength; i++) {
            const x = lineId.lineType == LineType.ROW ? i : lineId.index;
            const y = lineId.lineType == LineType.ROW ? lineId.index : i;

            this.setCellState(x, y, lineKnowledge.cells[i]);
        }
    }

};

/**
 * Removes all elements from the given array that satisfy the given predicate. Returns true if something was removed.
 * 
 * @template T
 * @param {Array<T>} arr 
 * @param {(val: T) => boolean} pred
 * @returns {boolean}
 */
function removeIf(arr, pred) {
    /* Create filtered array */
    const newArr = arr.filter(x => !pred(x));

    if (arr.length == newArr.length) {
        return false;
    }

    /* Overwrite */
    arr.length = newArr.length;
    for (let i = 0; i < arr.length; i++) {
        arr[i] = newArr[i];
    }

    return true;
}