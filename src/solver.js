import { CellKnowledge, DeductionFlags, LineId, LineKnowledge, LineType, NonogramInput, SingleDeductionResult } from "./types/nonogram-types.js";
import { arraysEqual as arraysEqual } from "./util.js";

/**
 * Based on the given input, performs the next possible deduction for the nonogram.
 * @param {NonogramInput} input
 * @returns {SingleDeductionResult}
 */
export function deduceNext(input) {
    /* Try deducing rows */
    for (let row = 0; row < input.height; row++) {
        const curKnowledge = input.state.getRowKnowledge(row);
        const newKnowledge = lineDeduction(curKnowledge, input.rowHints[row]);

        const somethingDeduced = !arraysEqual(curKnowledge.cells, newKnowledge.cells);

        if (!somethingDeduced) {
            continue;
        }

        return new SingleDeductionResult(
            DeductionFlags.BIT_DEDUCTION_MADE,
            new LineId(LineType.ROW, row),
            newKnowledge
        );
    }

    /* Try deducing columns */
    for (let col = 0; col < input.width; col++) {
        const curKnowledge = input.state.getColKnowledge(col);
        const newKnowledge = lineDeduction(curKnowledge, input.colHints[col]);

        const somethingDeduced = !arraysEqual(curKnowledge.cells, newKnowledge.cells);

        if (!somethingDeduced) {
            continue;
        }

        return new SingleDeductionResult(
            DeductionFlags.BIT_DEDUCTION_MADE,
            new LineId(LineType.COLUMN, col),
            newKnowledge
        );
    }

    /* Nothing was deducible */
    return SingleDeductionResult.noDeduction();
}

/**
 * This function checks all possible configurations of the line. It skips configurations that are impossible w.r.t.
 * the given line knowledge.
 * Squares that are always black in all remaining configurations are deduced as black, vice versa for white. The
 * function returns the new deduced line knowledge.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints
 * @returns {LineKnowledge}
 */
function lineDeduction(lineKnowledge, hints) {
    const lineLength = lineKnowledge.cells.length;

    /*
     * For every valid configuration, the relevant item in this array will be OR-ed with 1 (0b01, black) or 
     * (0b10, white). That way, cells that were always white will have a value of 2, cells that were always black a
     * value of 1 and cells that were both in some combination a value of 3.
     */
    const newDeducedState = Array(lineLength).fill(0);

    /** @type {Array<number>} */ 
    let gaps = [];

    do {
        const configurationComplete = gaps.length == hints.length;
        const gapsValid = checkGapValidity(lineKnowledge, hints, gaps);

        /* If configuration is complete and valid: Write into new deduced state */
        if (configurationComplete && gapsValid) {
            traverseConfiguration(gaps, hints, lineLength, (idx, knowledge) => {
                if (knowledge == CellKnowledge.UNKNOWN) {
                    throw new Error("Configuration was complete, unknown is impossible.");
                }

                newDeducedState[idx] |= knowledge == CellKnowledge.DEFINITELY_BLACK ? 1 : 2;
            });
        }

        nextConfiguration(hints, gaps, lineLength, gapsValid);
    } while (gaps.length > 0);

    /* Create new line knowledge */
    const cells = [];
    for (let i = 0; i < lineLength; i++) {
        var knowledge;
        switch (newDeducedState[i]) {
            case 1: knowledge = CellKnowledge.DEFINITELY_BLACK; break;
            case 2: knowledge = CellKnowledge.DEFINITELY_WHITE; break;
            case 3: knowledge = CellKnowledge.UNKNOWN; break;
            default: throw new Error("Deduced state was: " + newDeducedState[i]);
        }

        cells.push(knowledge);
    }

    /* Done */
    return new LineKnowledge(cells);
}

/**
 * Modifies the given gaps array to represent the next configuration to attempt.
 * 
 * @param {Array<number>} hints 
 * @param {Array<number>} gaps 
 * @param {number} lineLength
 * @param {boolean} wasValid
 */
function nextConfiguration(hints, gaps, lineLength, wasValid) {
    const hintSum = hints.reduce((a, b) => a + b, 0);

    /* If gaps are missing, simply add the next smallest gap */
    if (wasValid && gaps.length < hints.length) {
        const minGap = gaps.length == 0 ? 0 : 1;
        gaps.push(minGap);
        return;
    }

    /* Increment last gap, remove if it exceeds its maximum. Do this "recursively" */
    while (gaps.length > 0) {
        const gapSum = gaps.reduce((a, b) => a + b, 0);
        const remainingGaps = hints.length - gaps.length;

        const lastGap = gaps[gaps.length - 1];
        const maxLastGap = lineLength - hintSum - (gapSum - lastGap) - remainingGaps;

        /* If maximum was not reached: Simply increment gap */
        if (lastGap < maxLastGap) {
            gaps[gaps.length - 1] += 1;
            break;
        }

        /* Pop and increment predecessor in the next loop iteration */
        gaps.pop();
    }
}

/**
 * Checks if the configuration described by the given gaps (which are applied before each hint) is compatible with the
 * given line knowledge.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints 
 * @param {Array<number>} gaps
 * @returns {boolean}
 */
function checkGapValidity(lineKnowledge, hints, gaps) {
    const lineLength = lineKnowledge.cells.length;
    let valid = true;
    
    traverseConfiguration(gaps, hints, lineLength, (idx, knowledge) => {
        const curKnowledge = lineKnowledge.cells[idx];
        
        if (curKnowledge == CellKnowledge.DEFINITELY_BLACK && knowledge == CellKnowledge.DEFINITELY_WHITE) {
            valid = false;
        }

        if (curKnowledge == CellKnowledge.DEFINITELY_WHITE && knowledge == CellKnowledge.DEFINITELY_BLACK) {
            valid = false;
        }
    });

    return valid;
}

/**
 * Given a configuration of gaps and hints, performs the function fn on each cell of the line. The function gets the
 * information whether the cell is black, white or undetermined in this configuration.
 * 
 * @param {Array<number>} gaps 
 * @param {Array<number>} hints 
 * @param {number} lineLength 
 * @param {(index: number, knowledge: CellKnowledge) => void} fn 
 */
function traverseConfiguration(gaps, hints, lineLength, fn) {
    /* Preconditions */
    if (gaps.length > hints.length) {
        throw new Error("There can be at most as many gaps as there are hints. The final gap is deduced.");
    }

    if (gaps.reduce((a, b) => a + b, 0) + hints.reduce((a, b) => a + b, 0) > lineLength) {
        throw new Error("Sum of gaps and hints exceed line length");
    }

    for (let i = 0; i < gaps.length; i++) {
        const minGap = (i == 0) ? 0 : 1;
        if (gaps[i] < minGap) {
            throw new Error("Gap is too small!");
        }
    }

    /* Special case: Empty line */
    if (hints.length == 0) {
        for (let i = 0; i < lineLength; i++) {
            fn(i, CellKnowledge.DEFINITELY_WHITE);
        }

        return;
    }

    /* Special case: No gaps yet, everything is possible. */
    if (gaps.length == 0) {
        for (let i = 0; i < lineLength; i++) {
            fn(i, CellKnowledge.UNKNOWN);
        }

        return;
    }

    /* Default case: Iterate over gaps and hints */
    let curIdx = 0;
    for (let i = 0; i < gaps.length; i++) {
        const curGap = gaps[i];
        const curHint = hints[i];

        /* Gap */
        for (let j = 0; j < curGap; j++) {
            fn(curIdx, CellKnowledge.DEFINITELY_WHITE)
            curIdx += 1;
        }

        /* Hint */
        for (let j = 0; j < curHint; j++) {
            fn(curIdx, CellKnowledge.DEFINITELY_BLACK)
            curIdx += 1;
        }
    }

    /* After the last hint there must be a gap */
    if (curIdx < lineLength) {
        fn(curIdx, CellKnowledge.DEFINITELY_WHITE);
        curIdx += 1;
    }

    /* If the line is fully determined, all remaining squares are white */
    while (curIdx < lineLength) {
        fn(curIdx, gaps.length == hints.length ? CellKnowledge.DEFINITELY_WHITE : CellKnowledge.UNKNOWN);
        curIdx += 1;
    }
}