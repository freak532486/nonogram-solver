import * as global from "./global.js"
import * as inputParsing from "./input-parsing.js"
import * as dynamicUi from "./dynamic-ui.js"
import * as solver from "./solver.js"
import { DeductionFlags, LineType, NonogramInput } from "./types/nonogram-types.js";

const onHintChange = () => {
    inputParsing.updateInputState();
    dynamicUi.updateNonogramHintLabels();
};

const onBoardResize = () => {
    inputParsing.updateInputState();
    dynamicUi.rebuildNonogramContainer();
};

global.inputRowHints.oninput = onHintChange;
global.inputColHints.oninput = onHintChange;

global.inputNumRows.oninput = onBoardResize;
global.inputNumCols.oninput = onBoardResize;

global.btnSolve.onclick = doSolve;
global.btnHint.onclick = doHint;
global.btnReset.onclick = doReset;


/**
 * Tries to fully solve the nonogram.
 */
function doSolve() {
    while (doHint()) {}
}

/**
 * Performs a deduction. Returns 'false' if no deduction can be made anymore.
 * 
 * @returns {boolean}
 */
function doHint() {
    const solverInput = global.getSolverInput();
    const next = solver.deduceNext(solverInput);

    if ((next.statusFlags & DeductionFlags.BIT_DEDUCTION_MADE) == 0) {
        return false;
    }

    /* Apply deduction */
    if (next.lineId.lineType == LineType.ROW) {
        const row = next.lineId.index;
        for (let col = 0; col < solverInput.width; col++) {
            solverInput.state.updateCell(col, row, next.newKnowledge.cells[col]);
        }
    } else {
        const col = next.lineId.index;
        for (let row = 0; row < solverInput.width; row++) {
            solverInput.state.updateCell(col, row, next.newKnowledge.cells[row]);
        }
    }

    /* Update board state */
    dynamicUi.updateNonogramBoardState();
    return true;
}

function doReset() {
    const rowHints = global.getUserInput().rowHints;
    const colHints = global.getUserInput().colHints;
    global.setSolverInput(NonogramInput.withEmptyBoard(rowHints, colHints));
    dynamicUi.updateNonogramBoardState();
}