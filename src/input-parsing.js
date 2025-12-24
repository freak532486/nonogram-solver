import * as global from "./global.js";
import { CellKnowledge, NonogramInput } from "./types/nonogram-types.js";

/**
 * Updates the global state to match the current user inputs.
 */
export function updateInputState() {
    updateUserInputState();
    updateSolverInputState();
}

/**
 * Updates the global user input state to match the current content of the web components. 
 */
function updateUserInputState() {
    const userInput = global.getUserInput();

    /* Update number of rows and columns */
    userInput.numRows = Math.max(1, safeParseInt(global.inputNumRows.value));
    userInput.numCols = Math.max(1, safeParseInt(global.inputNumCols.value));

    /* Try to parse hint texts */
    let rowHintsParsed = tryParseHints(global.inputRowHints.value);
    if (!rowHintsParsed.error && rowHintsParsed.hints.length != userInput.numRows) {
        rowHintsParsed.error = "Wrong number of lines (" + rowHintsParsed.hints.length + "/" + userInput.numRows + ")";
    }

    userInput.rowHints = rowHintsParsed.hints;
    userInput.rowHintsErr = rowHintsParsed.error;

    let colHintsParsed = tryParseHints(global.inputColHints.value);
    if (!colHintsParsed.error && colHintsParsed.hints.length != userInput.numCols) {
        colHintsParsed.error = "Wrong number of lines (" + colHintsParsed.hints.length + "/" + userInput.numCols + ")";
    }

    userInput.colHints = colHintsParsed.hints;
    userInput.colHintsErr = colHintsParsed.error;
}

/**
 * Tries to parse a string to an integer. Returns 0 if it fails.
 * @param {string} x
 * @returns {number}
 */
function safeParseInt(x) {
    const parsed = Number(x);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Tries to parse a hints text. Returns a list of hints or 'null' on error.
 * 
 * @param {string} hintsStr
 * @returns {HintParsingResult}
 */
function tryParseHints(hintsStr) {
    let ret = new HintParsingResult();

    let lines = hintsStr.split("\n");
    for (const untrimmedLine of lines) {
        /* Trim line for easier parsing */
        const line = untrimmedLine.trim();

        /* Skip empty lines */
        if (!line) {
            continue;
        }

        let curHints = [];
        let words = line.split(" ");

        for (const word of words) {
            /* Try to parse the integer */
            let parsed = Number(word);

            /* On success: Add a hint */
            if (!Number.isNaN(parsed)) {
                curHints.push(parsed);
                continue;
            }

            /* Error. Use zero hint as default, skip this line */
            ret.error = "Invalid input: '" + word + "'";
            curHints = [ 0 ];
            break;
        }

        ret.hints.push(curHints);
    }

    return ret;
}

function updateSolverInputState() {
    const userInput = global.getUserInput();

    /* Initialize solver input if it hasn't happened yet */
    if (!global.isSolverInputInitialized()) {
        global.setSolverInput(NonogramInput.withEmptyBoard(userInput.rowHints, userInput.colHints));
        return;
    }

    /* On size change: Recreate entire solver input */
    const widthChanged = global.getSolverInput().width == userInput.numCols;
    const heightChanged = global.getSolverInput().height == userInput.numRows;

    if (widthChanged || heightChanged) {
        global.setSolverInput(NonogramInput.withEmptyBoard(userInput.rowHints, userInput.colHints));
        return;
    }

    /* On hint-only change: Simply update hints. */
    global.setSolverInput(NonogramInput.withExistingState(
        userInput.rowHints, 
        userInput.colHints, 
        global.getSolverInput().state
    ));
}

class HintParsingResult {
    /**
     * Will be empty if the hint text could not be parsed.
     * @type {Array<Array<number>>}
     */
    hints = [];

    /**
     * Error that occured during parsing. If no error occured, will be empty.
     * @type {string}
     */
    error = "";
}

export function applyPrefillToState() {
    const prefill = global.inputPrefill.value;

    const lines = prefill.split("\n");
    for (var row = 0; row < lines.length; row++) {
        var col = 0;

        /* Ignore excess rows */
        if (row >= global.getSolverInput().height) {
            break;
        }

        for (const symbol of lines[row]) {
            /* Ignore excess columns */
            if (col >= global.getSolverInput().width) {
                break;
            }

            /* Apply symbols with meaning, ignore the rest */
            if (symbol == '#') {
                global.getSolverInput().state.updateCell(col, row, CellKnowledge.DEFINITELY_BLACK);
                col++;
            }

            if (symbol == '.') {
                global.getSolverInput().state.updateCell(col, row, CellKnowledge.UNKNOWN);
                col++;
            }

            if (symbol == 'X' || symbol == 'x') {
                global.getSolverInput().state.updateCell(col, row, CellKnowledge.DEFINITELY_WHITE);
                col++;
            }
        }
    }
}