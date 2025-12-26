import * as appState from "./app-state.js";
import { SerializedState } from "./storage.js";
import { CellKnowledge } from "./types/nonogram-types.js";

const NONOGRAM_CELL_SIZE = "20px";
const NONOGRAM_CELL_SIZE_CLICKED = "16px";

const HINT_AREA_MIN_LINES = 2;
const HINT_AREA_MAX_LINES = 15;

const btnStorageLoad = /** @type {!HTMLElement} */ (document.getElementById("btn-storage-load"));
const btnStorageSave = /** @type {!HTMLElement} */ (document.getElementById("btn-storage-save"));
const btnStorageDelete = /** @type {!HTMLElement} */ (document.getElementById("btn-storage-delete"));

const btnHint = /** @type {!HTMLElement} */ (document.getElementById("btn-hint"));
const btnNext = /** @type {!HTMLElement} */ (document.getElementById("btn-next"));
const btnSolve = /** @type {!HTMLElement} */ (document.getElementById("btn-solve"));
const btnReset = /** @type {!HTMLElement} */ (document.getElementById("btn-reset"));

const btnPrefillApply = /** @type {HTMLTextAreaElement} */ (document.getElementById("button-prefill-apply"));

const inputNumRows = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-rows"));
const inputNumCols = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-cols"));

const inputRowHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-row-hints"));
const inputColHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-col-hints"));

const inputPrefill = /** @type {HTMLTextAreaElement} */ (document.getElementById("input-prefill"));

const errlabelRowHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-row-hints"));
const errlabelColHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-col-hints"));

const nonogramContainer = /** @type {!HTMLElement} */ (document.getElementById("nonogram-container"));
const nonogramStatus = /** @type {!HTMLElement} */ (document.getElementById("nonogram-status"));

/**
 * Enum of all the buttons on the view.
 * 
 * @enum {number}
 */
export const Button = Object.freeze({
    LOAD: 0,
    SAVE: 1,
    DELETE: 2,

    HINT: 3,
    NEXT: 4,
    SOLVE: 5,
    RESET: 6,

    APPLY_PREFILL: 7
});

/**
 * Enum of all the inputs on the view.
 * 
 * @enum {number}
 */
export const Input = Object.freeze({
    NUM_ROWS: 0,
    NUM_COLUMNS: 1,
    ROW_HINTS: 2,
    COLUMN_HINTS: 3,
    PREFILL: 4
})

/**
 * Sets the function that is executed when clicking the given button.
 * 
 * @param {Button} button 
 * @param {() => void} fn 
 */
export function setButtonFunction(button, fn) {
    switch (button) {
        case Button.LOAD: btnStorageLoad.onclick = fn; break;
        case Button.SAVE: btnStorageSave.onclick = fn; break;
        case Button.DELETE: btnStorageDelete.onclick = fn; break;
        case Button.HINT: btnHint.onclick = fn; break;
        case Button.NEXT: btnNext.onclick = fn; break;
        case Button.SOLVE: btnSolve.onclick = fn; break;
        case Button.RESET: btnReset.onclick = fn; break;
        case Button.APPLY_PREFILL: btnPrefillApply.onclick = fn; break;
        default: throw new Error("Unknown button: " + button);
    }
}

/**
 * Returns the current value inside the given input.
 * 
 * @param {Input} input
 * @return {string} 
 */
export function getInputValue(input) {
    switch (input) {
        case Input.NUM_ROWS: return inputNumRows.value;
        case Input.NUM_COLUMNS: return inputNumCols.value;
        case Input.ROW_HINTS: return inputRowHints.value;
        case Input.COLUMN_HINTS: return inputColHints.value;
        case Input.PREFILL: return inputPrefill.value;
        default: throw new Error("Unknown input: " + input);
    }
}

/**
 * Sets the input listener for an input field.
 * 
 * @param {Input} input 
 * @param {(ev: Event) => void} fn 
 */
export function setInputListener(input, fn) {
    switch (input) {
        case Input.NUM_ROWS: inputNumRows.oninput = fn; break;
        case Input.NUM_COLUMNS: inputNumCols.oninput = fn; break;
        case Input.ROW_HINTS: inputRowHints.oninput = fn; break;
        case Input.COLUMN_HINTS: inputColHints.oninput = fn; break;
        case Input.PREFILL: inputPrefill.oninput = fn; break;
        default: throw new Error("Unknown input: " + input);
    }
}

/**
 * Refreshes the view so that it accurately depicts the current state.
 */
export function refresh() {
    writeStateToView();
    refreshNonogramContainer();
    refreshNonogramBoardState();
    refreshNonogramHintLabels();
    resizeTextAreas();
}

/**
 * Writes the current application state into the input fields.
 */
function writeStateToView() {
    const state = appState.getCurrentState();

    inputNumRows.value = String(state.numRows);
    inputNumCols.value = String(state.numCols);
    inputRowHints.value = state.rowHints.map(arr => arr.join(" ")).join("\n");
    inputColHints.value = state.colHints.map(arr => arr.join(" ")).join("\n");
    errlabelRowHints.textContent = state.rowHintsErr;
    errlabelColHints.textContent = state.colHintsErr;
}

/**
 * Given the values in 'input', rebuilds the nonogram container to match the input.
 */
function refreshNonogramContainer() {
    const userInput = appState.getCurrentState();

    /* Build list of new children */
    let newChildren = [];

    /* Prepare layout grid */
    nonogramContainer.style.gridTemplateColumns = `repeat(${userInput.numCols + 1}, auto)`;
    nonogramContainer.style.gridTemplateRows = `repeat(${userInput.numRows + 1}, auto);`;

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
    nonogramContainer.replaceChildren(...newChildren);
    refreshNonogramHintLabels();
    refreshNonogramBoardState();
}

/**
 * Updates the text inside the nonogram hint spans.
 */
function refreshNonogramHintLabels() {
    const userInput = appState.getCurrentState();

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
    errlabelRowHints.replaceChildren(document.createTextNode(userInput.rowHintsErr));
    errlabelColHints.replaceChildren(document.createTextNode(userInput.colHintsErr));
}

function refreshNonogramBoardState() {
    /* Nothing to do if there is no solver input yet */
    const solverState = appState.getCurrentState().nonogramState;

    for (let row = 0; row < solverState.height; row++) {
        for (let col = 0; col < solverState.width; col++) {
            const cell = document.getElementById(`cell-${col}-${row}`);
            if (!cell) {
                continue;
            }

            const knowledge = solverState.getCell(col, row);            
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
 * Applies the given serialized state to the DOM elements.
 * 
 * @param {SerializedState} state 
 */
export function applySerializedState(state) {
    /* Apply state (except solver state) */
    inputNumRows.value = String(state.numRows);
    inputNumCols.value = String(state.numCols);
    inputRowHints.value = state.rowHints;
    inputColHints.value = state.colHints;
    inputPrefill.value = state.prefill;
}


/**
 * Returns the color that the cell at the given location should have based on the current solver state.
 * 
 * @param {number} col 
 * @param {number} row
 * @returns {string} 
 */
function getCellColor(col, row) {
    const state = appState.getCurrentState().nonogramState.getCell(col, row);

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
    const state = appState.getCurrentState().nonogramState.getCell(col, row);

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
    ret.style.width = NONOGRAM_CELL_SIZE;
    ret.style.height = NONOGRAM_CELL_SIZE;

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
        ret.style.width = NONOGRAM_CELL_SIZE;
        ret.style.height = NONOGRAM_CELL_SIZE;
    }

    ret.onmousedown = _ => {
        ret.style.width = NONOGRAM_CELL_SIZE_CLICKED;
        ret.style.height = NONOGRAM_CELL_SIZE_CLICKED;
    }

    ret.onmouseup = ev => {
        ret.style.width = NONOGRAM_CELL_SIZE;
        ret.style.height = NONOGRAM_CELL_SIZE;

        /* Update solver state */
        const curKnowledge = appState.getCurrentState().nonogramState.getCell(col, row);
        const nextKnowledge = nextCellKnowledge(curKnowledge, ev.button);

        appState.getCurrentState().nonogramState.updateCell(col, row, nextKnowledge);
        refreshNonogramBoardState();
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

    ret.style.height = NONOGRAM_CELL_SIZE;
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

    ret.style.width = NONOGRAM_CELL_SIZE;
    ret.style.gridColumn = String(col + 2);
    ret.style.gridRow = String(1);

    ret.id = "colhint-" + col;
    ret.className = "nonogram-colhint";

    return ret;
}

/**
 * Resized the hint text areas depending on the size of the board.
 */
function resizeTextAreas() {
    let numLines = Math.max(appState.getCurrentState().numRows, appState.getCurrentState().numCols);
    numLines = Math.min(HINT_AREA_MAX_LINES, Math.max(HINT_AREA_MIN_LINES, numLines));

    /* 12pt per line seems to work well. */
    inputRowHints.style.height = `${numLines * 12}pt`;
    inputColHints.style.height = `${numLines * 12}pt`;
    inputPrefill.style.height = `${numLines * 12}pt`;
}

/**
 * Sets the current nonogram status message.
 * 
 * @param {string} msg 
 */
export function setStatusMessage(msg) {
    nonogramStatus.textContent = msg;
}