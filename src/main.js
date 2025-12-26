import * as appState from "./app-state.js";
import * as solver from "./solver.js";
import * as storage from "./storage.js";
import { DeductionStatus, LineType, NonogramInput, NonogramState, SingleDeductionResult } from "./types/nonogram-types.js";
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
    const input = buildSolverInput();
    let anythingDeduced = false;

    while (true) {
        const deductionResult = deduceAndApply(input);
        if (deductionResult.status != DeductionStatus.DEDUCTION_MADE) {
            break;
        }

        anythingDeduced = true;
    }

    if (anythingDeduced) {
        appState.updateNonogramState(input.state);
    }
    view.refresh();
}

/**
 * Updates the status message based on the status flags.
 * 
 * @param {DeductionStatus} statusFlags 
 */
function updateStatus(statusFlags) {
    switch (statusFlags) {
        case DeductionStatus.COULD_NOT_DEDUCE:
            view.setStatusMessage("Solver cannot find a viable deduction.");
            break;

        case DeductionStatus.DEDUCTION_MADE:
            view.setStatusMessage("Deduction made.");
            break;

        case DeductionStatus.WAS_IMPOSSIBLE:
            view.setStatusMessage("Puzzle is impossible.");
            break;

        case DeductionStatus.WAS_SOLVED:
            view.setStatusMessage("Puzzle is solved.");
            break;
    }
}

/**
 * Performs a deduction, displays it as a hint.
 */
function doHint() {
    const solverInput = buildSolverInput();
    const deduction = solver.deduceNext(solverInput);

    updateStatus(deduction.status);
    if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
        return;
    }

    /* Print hint */
    view.setStatusMessage("You can make a deduction in " + deduction.lineId + ".");
}

/**
 * Performs a single deduction..
 */
function doNext() {
    /* Run solver */
    const solverInput = buildSolverInput();
    const deduction = deduceAndApply(solverInput);

    updateStatus(deduction.status);
    if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
        return false;
    }

    /* Update board state */
    appState.updateNonogramState(solverInput.state);
    view.refresh();
    return true;
}

/**
 * Performs a single deduction step. Mutates the given state to apply the deduction.
 * 
 * @param {NonogramInput} curInput 
 * @returns {SingleDeductionResult}
 */
function deduceAndApply(curInput) {
    /* Run solver */
    const deduction = solver.deduceNext(curInput);

    updateStatus(deduction.status);
    if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
        return deduction;
    }

    /* Apply deduction */
    const curState = curInput.state;
    if (deduction.lineId.lineType == LineType.ROW) {
        const row = deduction.lineId.index;
        for (let col = 0; col < curInput.width; col++) {
            curState.updateCell(col, row, deduction.newKnowledge.cells[col]);
        }
    } else {
        const col = deduction.lineId.index;
        for (let row = 0; row < curInput.width; row++) {
            curState.updateCell(col, row, deduction.newKnowledge.cells[row]);
        }
    }

    return deduction;
}

function doUndo() {
    if (appState.undoNonogramState()) {
        view.refresh();
        view.setStatusMessage("Undone.")
    } else {
        view.setStatusMessage("Nothing to undo.");
    }
}

function doRedo() {
    if (appState.redoNonogramState()) {
        view.refresh();
        view.setStatusMessage("Redone.");
    } else {
        view.setStatusMessage("Nothing to redo.");
    }
}

function doReset() {
    appState.resetBoardState();
    view.refresh();
}

function buildSolverInput() {
    return new NonogramInput(
        appState.getCurrentState().rowHints,
        appState.getCurrentState().colHints,
        NonogramState.clone(appState.getNonogramState())
    );
}

/**
 * This is called when the page is (re-)loaded. It synchronizes the DOM with the application state and rebuilds the
 * nonogram UI.
 * This is necessary because the DOM is not fully deconstructed on a page reload.
 */
function onReload() {
    /* Write values into DOM */
    appState.init();
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
view.setButtonFunction(view.Button.UNDO, doUndo);
view.setButtonFunction(view.Button.REDO, doRedo);
view.setButtonFunction(view.Button.RESET, doReset);

document.addEventListener("DOMContentLoaded", onReload);