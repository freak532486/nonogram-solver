import * as global from "./global.js";

/**
 * Given the values in 'input', rebuilds the nonogram container to match the input.
 */
export function rebuildNonogramContainer() {
    /* Build list of new children */
    let newChildren = [];

    /* Prepare layout grid */
    global.nonogramContainer.style.gridTemplateColumns = `repeat(${global.input.numCols + 1}, auto)`;
    global.nonogramContainer.style.gridTemplateRows = `repeat(${global.input.numRows + 1}, auto);`;

    /* Add hint elements */
    for (let row = 0; row < global.input.numRows; row++) {
        newChildren.push(createRowHintSpan(row));
    }

    for (let col = 0; col < global.input.numCols; col++) {
        newChildren.push(createColHintSpan(col));
    }

    /* Add cells */
    for (let col = 0; col < global.input.numCols; col++) {
        for (let row = 0; row < global.input.numRows; row++) {
            newChildren.push(createNonogramCell(col, row));
        }
    }

    /* Replace content */
    global.nonogramContainer.replaceChildren(...newChildren);
    updateNonogramHintLabels();
}

/**
 * Updates the text inside the nonogram hint spans.
 */
export function updateNonogramHintLabels() {
    /* Rows */
    for (let row = 0; row < global.input.numRows; row++) {
        let rowSpan = document.getElementById("rowhint-" + row);
        if (!rowSpan) {
            continue;
        }

        rowSpan.innerHTML = "";
        rowSpan.appendChild(document.createTextNode(global.input.rowHints[row].join(" ")));
    }

    /* Columns */
    for (let col = 0; col < global.input.numCols; col++) {
        let colSpan = document.getElementById("colhint-" + col);
        if (!colSpan) {
            continue;
        }

        colSpan.innerHTML = "";
        for (const hint of global.input.colHints[col]) {
            colSpan.appendChild(document.createTextNode(String(hint)));
            colSpan.appendChild(document.createElement("br"));
        }
    }

    /* Error labels */
    global.errlabelRowHints.replaceChildren(document.createTextNode(global.input.rowHintsErr));
    global.errlabelColHints.replaceChildren(document.createTextNode(global.input.colHintsErr));
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

    /* Cells can be interacted with */
    ret.onmouseenter = _ => {
        ret.style.backgroundColor = "#00000015";
    }

    ret.onmouseleave = _ => {
        ret.style.backgroundColor = "#00000000";
    }

    return ret;
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