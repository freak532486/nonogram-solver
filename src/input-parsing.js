import * as global from "./global.js";

/**
 * Updates the global state to match the current user inputs.
 */
export function updateInputState() {
    /* Update number of rows and columns */
    global.input.numRows = Math.max(1, safeParseInt(global.inputNumRows.value));
    global.input.numCols = Math.max(1, safeParseInt(global.inputNumCols.value));

    /* Try to parse hint texts */
    let rowHintsParsed = tryParseHints(global.inputRowHints.value);
    if (!rowHintsParsed.error && rowHintsParsed.hints.length != global.input.numRows) {
        rowHintsParsed.error = "Wrong number of lines (" + rowHintsParsed.hints.length + "/" + global.input.numRows + ")";
    }

    global.input.rowHints = rowHintsParsed.hints;
    global.input.rowHintsErr = rowHintsParsed.error;

    let colHintsParsed = tryParseHints(global.inputColHints.value);
    if (!colHintsParsed.error && colHintsParsed.hints.length != global.input.numCols) {
        colHintsParsed.error = "Wrong number of lines (" + colHintsParsed.hints.length + "/" + global.input.numCols + ")";
    }

    global.input.colHints = colHintsParsed.hints;
    global.input.colHintsErr = colHintsParsed.error;
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