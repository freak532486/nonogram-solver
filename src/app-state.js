import { AppState } from "./types/input-data.js";
import { CellKnowledge, NonogramState } from "./types/nonogram-types.js";
import * as view from "./view.js";

const NONOGRAM_INITIAL_WIDTH = 5;
const NONOGRAM_INITIAL_HEIGHT = 5;

let appState = new AppState(NONOGRAM_INITIAL_HEIGHT, NONOGRAM_INITIAL_WIDTH);

/**
 * Returns the current user input state.
 * 
 * @returns {AppState}
 */
export function getCurrentState() {
    return appState;
}

/**
 * Updates the global state to match the current user inputs.
 */
export function updateStateFromView() {
    /* Update number of rows and columns */
    appState.numRows = Math.max(1, safeParseInt(view.getInputValue(view.Input.NUM_ROWS)));
    appState.numCols = Math.max(1, safeParseInt(view.getInputValue(view.Input.NUM_COLUMNS)));
    appState.rawRowHints = view.getInputValue(view.Input.ROW_HINTS);
    appState.rawColHints = view.getInputValue(view.Input.COLUMN_HINTS);

    /* Try to parse hint texts */
    let rowHintsParsed = tryParseHints(appState.rawRowHints);
    if (!rowHintsParsed.error && rowHintsParsed.hints.length != appState.numRows) {
        rowHintsParsed.error = "Wrong number of lines (" + rowHintsParsed.hints.length + "/" + appState.numRows + ")";
    }

    appState.rowHints = rowHintsParsed.hints;
    appState.rowHintsErr = rowHintsParsed.error;

    let colHintsParsed = tryParseHints(appState.rawColHints);
    if (!colHintsParsed.error && colHintsParsed.hints.length != appState.numCols) {
        colHintsParsed.error = "Wrong number of lines (" + colHintsParsed.hints.length + "/" + appState.numCols + ")";
    }

    appState.colHints = colHintsParsed.hints;
    appState.colHintsErr = colHintsParsed.error;

    /* Regenerate board if necessary */
    if (appState.nonogramState.width == appState.numCols && appState.nonogramState.height == appState.numRows) {
        return;
    }

    appState.nonogramState = new NonogramState(appState.numCols, appState.numRows);
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
    const prefill = view.getInputValue(view.Input.PREFILL);

    const lines = prefill.split("\n");
    for (let row = 0; row < lines.length; row++) {
        let col = 0;

        /* Ignore excess rows */
        if (row >= appState.nonogramState.height) {
            break;
        }

        for (const symbol of lines[row]) {
            /* Ignore excess columns */
            if (col >= appState.nonogramState.width) {
                break;
            }

            /* Apply symbols with meaning, ignore the rest */
            if (symbol == '#') {
                appState.nonogramState.updateCell(col, row, CellKnowledge.DEFINITELY_BLACK);
                col++;
            }

            if (symbol == '.') {
                appState.nonogramState.updateCell(col, row, CellKnowledge.UNKNOWN);
                col++;
            }

            if (symbol == 'X' || symbol == 'x') {
                appState.nonogramState.updateCell(col, row, CellKnowledge.DEFINITELY_WHITE);
                col++;
            }
        }
    }
}

export function resetBoardState() {
    const state = appState.nonogramState;

    for (let row = 0; row < state.height; row++) {
        for (let col = 0; col < state.width; col++) {
            state.updateCell(col, row, CellKnowledge.UNKNOWN);
        }
    }
}