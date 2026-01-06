import { CellKnowledge } from "../../common/nonogram-types.js";
import { Point } from "../../common/point.js";
import { arraysEqual } from "../../util.js";

const CELL_SIZE_PX = 16;
const FONT_SIZE = "10pt";

export class BoardComponentFullState {
     /** @type {Array<CellKnowledge>} */
    cells;

    /**
     * 
     * @param {Array<CellKnowledge>} cells 
     */
    constructor (cells) {
        this.cells = cells;
    }

    /**
     * Creates an empty state
     * 
     * @param {number} width 
     * @param {number} height 
     * @returns {BoardComponentFullState}
     */
    static empty(width, height) {
        return new BoardComponentFullState(Array(width * height).fill(CellKnowledge.UNKNOWN));
    }

    /**
     * Returns 'true' if this state is equal to some other state
     * 
     * @param {BoardComponentFullState} other
     * @returns {boolean}
     */
    equals(other) {
        return arraysEqual(this.cells, other.cells);
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
    #colHints;

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

        this.#state = Array(width * height).fill(CellKnowledge.UNKNOWN);

        /* Create templates */
        this.#cellBlackTemplate = document.createElement("div");
        this.#cellBlackTemplate.style.backgroundColor = "black";
        this.#cellBlackTemplate.style.borderRadius = "2px";
        this.#cellBlackTemplate.style.width = (CELL_SIZE_PX - 2) + "px";
        this.#cellBlackTemplate.style.height = (CELL_SIZE_PX - 2) + "px";

        this.#cellWhiteTemplate = document.createElement("span");
        this.#cellWhiteTemplate.style.fontFamily = "sans-serif";
        this.#cellWhiteTemplate.textContent = "X";

        /* Create row hint divs */
        this.#rowHintDivs = [];
        for (let row = 0; row < height; row++) {
            /* Create hint container */
            const div = document.createElement("div");

            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.flexShrink = "0";
            div.style.justifyContent = "end";
            div.style.minWidth = CELL_SIZE_PX + "px";
            div.style.paddingRight = "2px";

            div.style.borderTop = (row == 0) ? "2px solid black" : "none";
            div.style.borderBottom = (row % 5 == 4) ? "2px solid black" : "1px solid black";
            div.style.borderLeft = "2px solid black";

            div.style.transformOrigin = "center right";

            /* Add hints to container */
            for (const hint of rowHints[row]) {
                const hintDiv = document.createElement("div");

                hintDiv.style.fontFamily = "Verdana";
                hintDiv.style.fontWeight = "bold";
                hintDiv.style.fontSize = FONT_SIZE;
                hintDiv.setAttribute("data-mode", "0");

                hintDiv.style.minWidth = CELL_SIZE_PX + "px";
                hintDiv.style.height = CELL_SIZE_PX + "px";
                hintDiv.style.display = "flex";
                hintDiv.style.alignItems = "center";
                hintDiv.style.justifyContent = "end";
                hintDiv.style.userSelect = "none";
                hintDiv.textContent = String(hint);

                hintDiv.onclick = () => {
                    if (hintDiv.getAttribute("data-mode") == "0") {
                        hintDiv.setAttribute("data-mode", "1");
                        hintDiv.style.color = "#CCCCCC";
                        hintDiv.style.textDecoration = "line-through";
                    } else {
                        hintDiv.setAttribute("data-mode", "0");
                        hintDiv.style.color = "#000000";
                        hintDiv.style.textDecoration = "none";
                    }
                }

                div.appendChild(hintDiv);
            }

            this.#rowHintDivs.push(div);
        }

        /* Create column hint divs */
        this.#colHintDivs = [];
        for (let col = 0; col < width; col++) {
            /* Create hint container */
            const div = document.createElement("div");

            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.flexShrink = "0";
            div.style.justifyContent = "end";
            div.style.minHeight = CELL_SIZE_PX + "px";

            div.style.borderLeft = (col == 0) ? "2px solid black" : "none";
            div.style.borderRight = (col % 5 == 4) ? "2px solid black" : "1px solid black";
            div.style.borderTop = "2px solid black";

            /* Add hints to container */
            for (const hint of colHints[col]) {
                const hintDiv = document.createElement("div");

                hintDiv.style.fontFamily = "Verdana";
                hintDiv.style.fontWeight = "bold";
                hintDiv.style.fontSize = FONT_SIZE;
                hintDiv.setAttribute("data-mode", "0");

                hintDiv.style.width = CELL_SIZE_PX + "px";
                hintDiv.style.minHeight = CELL_SIZE_PX + "px";
                hintDiv.style.display = "flex";
                hintDiv.style.alignItems = "center";
                hintDiv.style.justifyContent = "center";
                hintDiv.style.userSelect = "none";
                hintDiv.textContent = String(hint);

                hintDiv.onclick = () => {
                    if (hintDiv.getAttribute("data-mode") == "0") {
                        hintDiv.setAttribute("data-mode", "1");
                        hintDiv.style.color = "#808080";
                        hintDiv.style.textDecoration = "line-through";
                    } else {
                        hintDiv.setAttribute("data-mode", "0");
                        hintDiv.style.color = "#000000";
                        hintDiv.style.textDecoration = "none";
                    }
                }

                div.appendChild(hintDiv);
            }

            this.#colHintDivs.push(div);
        }

        /* Create cells */
        this.#cellDivs = [];
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const div = document.createElement("div");

                div.style.width = CELL_SIZE_PX + "px";
                div.style.height = CELL_SIZE_PX + "px";

                div.style.borderLeft = (col == 0) ? "2px solid black" : "none";
                div.style.borderTop = (row == 0) ? "2px solid black" : "none";
                div.style.borderRight = (col % 5 == 4) ? "2px solid black" : "1px solid black";
                div.style.borderBottom = (row % 5 == 4) ? "2px solid black" : "1px solid black";

                div.style.display = "grid";
                div.style.gridTemplateColumns = "1fr";
                div.style.gridTemplateRows = "1fr";
                div.style.justifyItems = "center";
                div.style.alignItems = "center";
                div.style.alignContent = "center";
                div.style.userSelect = "none";

                div.style.cursor = "pointer";

                div.onclick = () => {
                    this.selection = new Point(col, row);
                    this.#clickListener(new Point(col, row));
                };

                this.#cellDivs.push(div);
            }
        }

        /* Create selection element */
        this.#selectionDiv.style.width = CELL_SIZE_PX + "px";
        this.#selectionDiv.style.height = CELL_SIZE_PX + "px";
        this.#selectionDiv.style.border = "2px solid red";
        this.#selectionDiv.style.borderRadius = "4px";
        this.#selectionDiv.style.boxSizing = "border-box";
        this.#selectionDiv.style.position = "absolute";
        this.#selectionDiv.style.zIndex = "10";

        /* Create root element */
        const view = document.createElement("div");

        view.style.display = "grid";
        view.style.gridTemplateRows = `max-content repeat(${height}, auto)`;
        view.style.gridTemplateColumns = `max-content repeat(${width}, auto)`;
        view.style.width = "fit-content";
        
        view.style.padding = "32px";
        view.style.backgroundColor = "white";
        view.style.border = "1px solid black";
        view.style.borderRadius = "10px";

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
                const div = this.getCellDiv(col, row);

                div.style.gridRow = String(row + 2);
                div.style.gridColumn = String(col + 2);

                view.appendChild(div);
            }
        }

        view.appendChild(this.#selectionDiv);
        this.#view = view;

        /* Initial selection value */
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
        const oldX = this.#selection.x;
        const oldY = this.#selection.y;

        p.x = Math.max(0, Math.min(this.#width - 1, p.x));
        p.y = Math.max(0, Math.min(this.#height - 1, p.y));
        this.#selection = p;

        /* Update selection div */
        if (p == null) {
            this.#selectionDiv.style = "hidden";
            return;
        }

        const cellDiv = this.getCellDiv(p.x, p.y);

        const style = getComputedStyle(cellDiv);
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const borderTop = parseFloat(style.borderTopWidth) || 0;

        this.#selectionDiv.style.left = (cellDiv.offsetLeft + borderLeft) + "px";
        this.#selectionDiv.style.top = (cellDiv.offsetTop + borderTop) + "px";
        

        /* Highlight hints */
        this.#rowHintDivs[oldY].style.backgroundColor = "white";
        this.#colHintDivs[oldX].style.backgroundColor = "white";

        this.#rowHintDivs[p.y].style.backgroundColor = "#aedbff";
        this.#colHintDivs[p.x].style.backgroundColor = "#aedbff";
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
    getCellDiv(x, y) {
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
        
        const div = this.getCellDiv(x, y);

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
        return new BoardComponentFullState([...this.#state]);
    }

    /**
     * Applies a full state to this board.
     * 
     * @param {BoardComponentFullState} state 
     */
    applyState(state) {
        const cells = state.cells;

        if (cells.length != this.#width * this.#height) {
            throw new Error("State has unexpected length");
        }

        for (let i = 0; i < cells.length; i++) {
            const x = i % this.#width;
            const y = Math.floor(i / this.#width);

            this.setCellState(x, y, cells[i]);
        }
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
            const cellDiv = this.getCellDiv(p.x, p.y);

            /* Compute border width */
            const style = getComputedStyle(cellDiv);
            const borderLeft = parseFloat(style.borderLeftWidth) || 0;
            const borderTop = parseFloat(style.borderTopWidth) || 0;

            const div = document.createElement("div");
            div.classList.add("line-preview");
            div.style.position = "absolute";
            div.style.left = (cellDiv.offsetLeft + borderLeft) + "px";
            div.style.top = (cellDiv.offsetTop + borderTop) + "px";
            div.style.width = CELL_SIZE_PX + "px";
            div.style.height = CELL_SIZE_PX + "px";
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.justifyContent = "center";
            div.style.backgroundColor = "var(--bg1)";

            const child = /** @type {HTMLElement} */ (template.cloneNode(true));
            child.style.opacity = "0.5";
            div.replaceChildren(child);
            this.view.appendChild(div);
        }
    }

};