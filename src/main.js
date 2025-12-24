import * as global from "./global.js"
import * as inputParsing from "./input-parsing.js"
import * as dynamicUi from "./dynamic-ui.js"
import * as solver from "./solver.js"
import { DeductionFlags, LineType } from "./types/nonogram-types.js";

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

global.btnHint.onclick = doHint;

function doHint() {
    const solverInput = global.getSolverInput();
    const next = solver.deduceNext(solverInput);

    if ((next.statusFlags & DeductionFlags.BIT_DEDUCTION_MADE) == 0) {
        alert("No deduction possible");
        return;
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
}