import * as global from "./global.js";
import { CellKnowledge } from "./types/nonogram-types.js";

const HINT_AREA_MIN_LINES = 2;
const HINT_AREA_MAX_LINES = 15;

/**
 * Given the values in 'input', rebuilds the nonogram container to match the input.
 */
export function rebuildNonogramContainer() {
    const userInput = global.getUserInput();

    /* Build list of new children */
    let newChildren = [];

    /* Prepare layout grid */
    global.nonogramContainer.style.gridTemplateColumns = `repeat(${userInput.numCols + 1}, auto)`;
    global.nonogramContainer.style.gridTemplateRows = `repeat(${userInput.numRows + 1}, auto);`;

    /* Add hint elements */
    for (let row = 0; row < userInput.numRows; row++) {
        newChildren.push(createRowHintSpan(row));
    }

    for (let col = 0; col < userInput.numCols; col++) {
        newChildren.push(createColHintSpan(col));
    }

    /* Add cells */
    for (let col = 0; col < userInput.numCols; col++) {
        for (let row = 0; row < userInput.numRows; row++) {
            newChildren.push(createNonogramCell(col, row));
        }
    }

    /* Replace content */
    global.nonogramContainer.replaceChildren(...newChildren);
    updateNonogramHintLabels();
    updateNonogramBoardState();
}

/**
 * Updates the text inside the nonogram hint spans.
 */
export function updateNonogramHintLabels() {
    const userInput = global.getUserInput();

    /* Rows */
    for (let row = 0; row < userInput.numRows; row++) {
        let rowSpan = document.getElementById("rowhint-" + row);
        if (!rowSpan) {
            continue;
        }

        rowSpan.innerHTML = "";
        rowSpan.appendChild(document.createTextNode(userInput.rowHints[row].join(" ")));
    }

    /* Columns */
    for (let col = 0; col < userInput.numCols; col++) {
        let colSpan = document.getElementById("colhint-" + col);
        if (!colSpan) {
            continue;
        }

        colSpan.innerHTML = "";
        for (const hint of userInput.colHints[col]) {
            colSpan.appendChild(document.createTextNode(String(hint)));
            colSpan.appendChild(document.createElement("br"));
        }
    }

    /* Error labels */
    global.errlabelRowHints.replaceChildren(document.createTextNode(userInput.rowHintsErr));
    global.errlabelColHints.replaceChildren(document.createTextNode(userInput.colHintsErr));
}

export function updateNonogramBoardState() {
    /* Nothing to do if there is no solver input yet */
    if (!global.isSolverInputInitialized()) {
        return;
    }

    const solverState = global.getSolverInput();

    for (let row = 0; row < solverState.height; row++) {
        for (let col = 0; col < solverState.width; col++) {
            const cell = document.getElementById(`cell-${col}-${row}`);
            if (!cell) {
                continue;
            }

            const knowledge = solverState.state.getCell(col, row);            
            cell.style.backgroundColor = getCellColor(col, row);

            if (knowledge == CellKnowledge.DEFINITELY_WHITE) {
                cell.replaceChildren(document.createTextNode("X"));
            } else {
                cell.replaceChildren();
            }
        }
    }
}

/**
 * Returns the color that the cell at the given location should have based on the current solver state.
 * 
 * @param {number} col 
 * @param {number} row
 * @returns {string} 
 */
function getCellColor(col, row) {
    const state = global.getSolverInput().state.getCell(col, row);

    switch (state) {
        case CellKnowledge.DEFINITELY_BLACK: return "#000000FF";
        default: return "#00000000";
    }
}

/**
 * Returns the color that the cell at the given location should have while the mouse is hovering over it, based on 
 * the current solver state.
 * 
 * @param {number} col 
 * @param {number} row
 * @returns {string} 
 */
function getCellColorHover(col, row) {
    const state = global.getSolverInput().state.getCell(col, row);

    switch (state) {
        case CellKnowledge.DEFINITELY_BLACK: return "#333333FF";
        default: return "#00000033";
    }
}

/**
 * Returns a div that represents a single cell of a nonogram.
 * @param {number} col
 * @param {number} row
 */
function createNonogramCell(col, row) {
    let ret = document.createElement("div");

    /* Basic style stuff */
    ret.style.width = global.NONOGRAM_CELL_SIZE;
    ret.style.height = global.NONOGRAM_CELL_SIZE;

    ret.style.gridColumn = String(col + 2);
    ret.style.gridRow = String(row + 2);

    ret.id = "cell-" + col + "-" + row;
    ret.className = "nonogram-cell";

    /* Prevent context menu to enable RMB clicks */
    ret.addEventListener("contextmenu", ev => ev.preventDefault());

    /* Cells can be interacted with */
    ret.onmouseenter = _ => {
        ret.style.backgroundColor = getCellColorHover(col, row);
    }

    ret.onmouseleave = _ => {
        ret.style.backgroundColor = getCellColor(col, row);
        ret.style.width = global.NONOGRAM_CELL_SIZE;
        ret.style.height = global.NONOGRAM_CELL_SIZE;
    }

    ret.onmousedown = _ => {
        ret.style.width = global.NONOGRAM_CELL_SIZE_CLICKED;
        ret.style.height = global.NONOGRAM_CELL_SIZE_CLICKED;
    }

    ret.onmouseup = ev => {
        ret.style.width = global.NONOGRAM_CELL_SIZE;
        ret.style.height = global.NONOGRAM_CELL_SIZE;

        /* Update solver state */
        const curKnowledge = global.getSolverInput().state.getCell(col, row);
        const nextKnowledge = nextCellKnowledge(curKnowledge, ev.button);

        global.getSolverInput().state.updateCell(col, row, nextKnowledge);
        updateNonogramBoardState();
    }

    return ret;
}

/**
 * Given a current cell state and a mouse button id, returns the cell state that the cell should have after the button
 * has been clicked on that cell.
 * 
 * @param {CellKnowledge} current 
 * @param {number} button
 * @returns {CellKnowledge} 
 */
function nextCellKnowledge(current, button) {
    if (button == 0) {
        switch (current) {
            case CellKnowledge.UNKNOWN: return CellKnowledge.DEFINITELY_WHITE;
            case CellKnowledge.DEFINITELY_WHITE: return CellKnowledge.DEFINITELY_BLACK; 
            case CellKnowledge.DEFINITELY_BLACK: return CellKnowledge.UNKNOWN;
            default: throw new Error("Impossible case");
        }
    }

    if (button == 2) {
        switch (current) {
            case CellKnowledge.UNKNOWN: return CellKnowledge.DEFINITELY_BLACK;
            case CellKnowledge.DEFINITELY_BLACK: return CellKnowledge.DEFINITELY_WHITE; 
            case CellKnowledge.DEFINITELY_WHITE: return CellKnowledge.UNKNOWN;
            default: throw new Error("Impossible case");
        }
    }

    return current;
}

/**
 * Creates an empty span element to display hints of a single row.
 * @param {number} row 
 */
function createRowHintSpan(row) {
    let ret = document.createElement("span");

    ret.style.height = global.NONOGRAM_CELL_SIZE;
    ret.style.gridColumn = "1";
    ret.style.gridRow = String(row + 2);

    ret.id = "rowhint-" + row;
    ret.className = "nonogram-rowhint";

    return ret;
}

/**
 * Creates an empty span element to display hints of a single column.
 * @param {number} col 
 */
function createColHintSpan(col) {
    let ret = document.createElement("span");

    ret.style.width = global.NONOGRAM_CELL_SIZE;
    ret.style.gridColumn = String(col + 2);
    ret.style.gridRow = String(1);

    ret.id = "colhint-" + col;
    ret.className = "nonogram-colhint";

    return ret;
}

/**
 * Resized the hint text areas depending on the size of the board.
 */
export function resizeTextAreas() {
    var numLines = Math.max(global.getUserInput().numRows, global.getUserInput().numCols);
    numLines = Math.min(HINT_AREA_MAX_LINES, Math.max(HINT_AREA_MIN_LINES, numLines));

    /* 12pt per line seems to work well. */
    global.inputRowHints.style.height = `${numLines * 12}pt`;
    global.inputColHints.style.height = `${numLines * 12}pt`;
    global.inputPrefill.style.height = `${numLines * 12}pt`;
}
