import * as appState from "./app-state.js";
import * as solver from "./solver.js";
import * as storage from "./storage.js";
import { DeductionFlags, LineType, NonogramInput } from "./types/nonogram-types.js";
import * as view from "./view.js";

const onHintChange = () => {
    appState.updateStateFromView();
    view.refresh();
};

const onBoardResize = () => {
    appState.updateStateFromView();
    view.refresh();
};


/**
 * Tries to fully solve the nonogram.
 */
function doSolve() {
    while (doNext()) {}
}

/**
 * Updates the status message based on the status flags.
 * 
 * @param {number} statusFlags 
 */
function updateStatus(statusFlags) {
    const deductionMade = statusFlags & DeductionFlags.BIT_DEDUCTION_MADE;
    const solved = statusFlags & DeductionFlags.BIT_SOLVED;
    const impossible = statusFlags & DeductionFlags.BIT_IMPOSSIBLE;

    if (deductionMade && solved) {
        view.setStatusMessage("Deduction made; Puzzle is solved.");
    } else if (deductionMade && !solved) {
        view.setStatusMessage("Deduction made.");
    } else if (!deductionMade && impossible) {
        view.setStatusMessage("Puzzle is impossible.");
    } else if (!deductionMade && solved) {
        view.setStatusMessage("Puzzle is solved.");
    } else if (!deductionMade) {
        view.setStatusMessage("Solver cannot find a viable deduction.");
    } else {
        view.setStatusMessage("Inconsistent state.")
    }
}

/**
 * Performs a deduction, displays it as a hint.
 */
function doHint() {
    const solverInput = buildSolverInput();
    const next = solver.deduceNext(solverInput);

    updateStatus(next.statusFlags);

    if ((next.statusFlags & DeductionFlags.BIT_DEDUCTION_MADE) == 0) {
        return;
    }

    /* Print hint */
    view.setStatusMessage("You can make a deduction in " + next.lineId + ".");
}

/**
 * Performs a deduction. Returns 'false' if no deduction can be made anymore.
 * 
 * @return {boolean}
 */
function doNext() {
    const solverInput = buildSolverInput();
    const next = solver.deduceNext(solverInput);

    updateStatus(next.statusFlags);

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
    view.refresh();
    return true;
}

function doReset() {
    appState.resetBoardState();
    view.refresh();
}

function buildSolverInput() {
    return new NonogramInput(
        appState.getCurrentState().rowHints,
        appState.getCurrentState().colHints,
        appState.getCurrentState().nonogramState
    );
}

/**
 * This is called when the page is (re-)loaded. It synchronizes the DOM with the application state and rebuilds the
 * nonogram UI.
 * This is necessary because the DOM is not fully deconstructed on a page reload.
 */
function onReload() {
    /* Write values into DOM */
    view.refresh();
    view.setStatusMessage("No status");

    /* Re-initialize storage */
    storage.init();
    storage.refreshStorageUI();
}

view.setButtonFunction(view.Button.SAVE, () => {
    const key = storage.getTextboxValue();
    if (key) {
        storage.storeCurrentState(key);
    }
});

view.setButtonFunction(view.Button.LOAD, () => {
    const key = storage.getSelectedListValue();
    if (!key) {
        return;
    }

    const state = storage.fetchStoredInput(key);
    view.applySerializedState(state);
    appState.updateStateFromView();
    view.refresh();
});

view.setInputListener(view.Input.ROW_HINTS, onHintChange);
view.setInputListener(view.Input.COLUMN_HINTS, onHintChange);

view.setInputListener(view.Input.NUM_ROWS, onBoardResize);
view.setInputListener(view.Input.NUM_COLUMNS, onBoardResize);

view.setButtonFunction(view.Button.APPLY_PREFILL, () => {
    appState.applyPrefillToState();
    view.refresh();
});

view.setButtonFunction(view.Button.HINT, doHint);
view.setButtonFunction(view.Button.NEXT, doNext);
view.setButtonFunction(view.Button.SOLVE, doSolve);
view.setButtonFunction(view.Button.RESET, doReset);

document.addEventListener("DOMContentLoaded", onReload);