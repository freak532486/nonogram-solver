import { CellKnowledge, DeductionStatus, FullDeductionResult, LineId, LineKnowledge, LineType, NonogramState, SingleDeductionResult } from "./common/nonogram-types.js"

const PRINT_XML = true;
const TIMEOUT_SECS = 5;

/**
 * Performs a fullsolve.
 * 
 * @param {NonogramState} state
 * @returns {FullDeductionResult} 
 */
export function deduceAll(state) {
    /* For debugging, you can print as pbmsolver-xml */
    if (PRINT_XML) {
        printXml(state);
    }

    /* Create new state */
    const startTs = Date.now();
    const newState = NonogramState.clone(state);
    const keyFunc = getLineKeyFunction(state);

    /* Create list of all lines */
    let lines = new PriorityQueue(keyFunc);

    for (let row = 0; row < state.height; row++) {
        lines.push(new LineId(LineType.ROW, row));
    }

    for (let col = 0; col < state.width; col++) {
        lines.push(new LineId(LineType.COLUMN, col));
    }

    /* Deduce until no line is left */
    while (lines.size() > 0) {
        if (Date.now() - startTs > 1000 * TIMEOUT_SECS) {
            return new FullDeductionResult(DeductionStatus.TIMEOUT, newState);
        }

        const line = /** @type {LineId} */ (lines.pop());
        const deduction = deduceLine(newState, line);

        /* Skip on already-solved line or deduction failure */
        if (deduction.status == DeductionStatus.WAS_SOLVED || deduction.status == DeductionStatus.COULD_NOT_DEDUCE) {
            continue;
        }

        /* Quit on timeout or contradiction */
        if (deduction.status !== DeductionStatus.DEDUCTION_MADE) {
            return new FullDeductionResult(deduction.status, newState);
        }

        /* Add all changed perpendicular lines to lines to check */
        if (line.lineType == LineType.ROW) {
            const y = line.index;
            for (let x = 0; x < state.width; x++) {
                const col = new LineId(LineType.COLUMN, x);
                if (deduction.newKnowledge?.cells[x] == newState.getCell(x, y)) {
                    continue;
                }

                if (!lines.arr.some(lineId => lineId.lineType == col.lineType && lineId.index == col.index)) {
                    lines.push(col);
                }
            }
        } else {
            const x = line.index;
            for (let y = 0; y < state.height; y++) {
                const row = new LineId(LineType.ROW, y);
                if (deduction.newKnowledge?.cells[y] == newState.getCell(x, y)) {
                    continue;
                }

                if (!lines.arr.some(lineId => lineId.lineType == row.lineType && lineId.index == row.index)) {
                    lines.push(row);
                }
            }
        }

        /* Apply deduction to state */
        const singleDeduction = new SingleDeductionResult(deduction.status, line, deduction.newKnowledge); 
        newState.applyDeduction(singleDeduction);
    }

    /* Really shouldn't get here ever, but just in case... */
    return new FullDeductionResult(DeductionStatus.WAS_SOLVED, newState);
}

/** @param {NonogramState} state  */
function printXml(state) {
    var xml = "";

    xml += "<clues type=\"rows\">";
    for (const hints of state.rowHints) {
        xml += "<line>";
        for (const hint of hints) {
            xml += "<count>" + hint + "</count>";
        }
        xml += "</line>";
    }
    xml += "</clues>\n";

    xml += "<clues type=\"columns\">";
    for (const hints of state.colHints) {
        xml += "<line>";
        for (const hint of hints) {
            xml += "<count>" + hint + "</count>";
        }
        xml += "</line>";
    }
    xml += "</clues>\n";

    console.log(xml);
}

/**
 * Based on the given input, performs the next possible deduction for the nonogram.
 * @param {NonogramState} state
 * @returns {SingleDeductionResult}
 */
export function deduceNext(state) {
    /* Create list of all lines */
    const keyFunc = getLineKeyFunction(state);
    const lines = new PriorityQueue(keyFunc);

    for (let row = 0; row < state.height; row++) {
        const line = new LineId(LineType.ROW, row);
        lines.push(line);
    }

    for (let col = 0; col < state.width; col++) {
        const line = new LineId(LineType.COLUMN, col);
        lines.push(line);
    }

    let allSolved = true;
    while (lines.size() > 0) {
        const line = /** @type {LineId} */ (lines.pop());
        const deduction = deduceLine(state, line);
        allSolved = allSolved && deduction.status == DeductionStatus.WAS_SOLVED;

        /* Skip solved lines */
        if (deduction.status == DeductionStatus.WAS_SOLVED || deduction.status == DeductionStatus.COULD_NOT_DEDUCE) {
            continue;
        }

        /* Return on timeout, contradiction or deduced line. */
        return new SingleDeductionResult(deduction.status, line, deduction.newKnowledge);
    }

    return new SingleDeductionResult(allSolved ? DeductionStatus.WAS_SOLVED : DeductionStatus.COULD_NOT_DEDUCE, null, null);
}

/**
 * Returns the key function for sorting lines.
 * 
 * @param {NonogramState} state 
 * @returns {(line: LineId) => number}
 */
function getLineKeyFunction(state) {
    /* Order by hint size and number of filled squares */
    /** @param {LineId} lineId */
    return (lineId) => {
        /* Prioritize lines on the edges */
        if (lineId.lineType == LineType.COLUMN) {
            return Math.abs(lineId.index - state.colHints.length / 2);
        } else {
            return Math.abs(lineId.index - state.rowHints.length / 2);
        }
    };
}

/**
 * Performs a single line deduction.
 * 
 * @param {NonogramState} state 
 * @param {LineId} lineId 
 */
function deduceLine(state, lineId) {
    const curKnowledge = (lineId.lineType == LineType.ROW) ?
        state.getRowKnowledge(lineId.index) :
        state.getColKnowledge(lineId.index);

    const hints = (lineId.lineType == LineType.ROW) ?
        state.rowHints[lineId.index] :
        state.colHints[lineId.index];

    const ts = Date.now();
    const ret = overlapLineDeduction(curKnowledge, hints);
    console.log("Line deduction took " + (Date.now() - ts) + "ms");
    return ret;
}

class LineDeductionResult {

    /** @type {DeductionStatus} */
    status;

    /** @type {LineKnowledge | null} */
    newKnowledge;

    /**
     * @param {DeductionStatus} status 
     * @param {LineKnowledge | null} newKnowledge 
     */
    constructor(status, newKnowledge) {
        this.status = status;
        this.newKnowledge = newKnowledge;
    }
}


/**
* 
* @param {LineKnowledge} lineKnowledge 
* @param {Array<number>} hints
* @returns {LineDeductionResult}
*/
function overlapLineDeduction(lineKnowledge, hints) {
    const lineLength = lineKnowledge.cells.length;
    const newKnowledge = new LineKnowledge([...lineKnowledge.cells]);

    /* Get leftmost and rightmost solution */
    let ts = Date.now();
    const lSol = leftmostSolution(lineKnowledge, hints);
    const rSol = rightmostSolution(lineKnowledge, hints);
    console.log("Finding solutions took " + (Date.now() - ts) + "ms");

    /* No solution found => Impossible */
    if (!lSol || !rSol) {
        return new LineDeductionResult(DeductionStatus.WAS_IMPOSSIBLE, null);
    }

    /* Check each cell for hint or gap overlap */
    for (let x = 0; x < lineLength; x++) {
        /* Calculate which block (hint or gap) overlays x */
        const lBlock = calcContainedBlock(x, hints, lSol);
        const rBlock = calcContainedBlock(x, hints, rSol);

        /*
         * If x is overlaid by the same hint in both solutions, it must be black.
         * If x is overlaid by the same  gap in both solutions, it must be white.
         */
        if (lBlock.isGap !== rBlock.isGap) {
            continue;
        }

        if (lBlock.hintIdx !== rBlock.hintIdx) {
            continue;
        }

        const newCellKnowledge = lBlock.isGap ? CellKnowledge.DEFINITELY_WHITE : CellKnowledge.DEFINITELY_BLACK;
        const oppositeCellKnowledge = lBlock.isGap ? CellKnowledge.DEFINITELY_BLACK : CellKnowledge.DEFINITELY_WHITE;

        if (lineKnowledge.cells[x] == oppositeCellKnowledge) {
            return new LineDeductionResult(DeductionStatus.WAS_IMPOSSIBLE, null);
        }

        newKnowledge.cells[x] = newCellKnowledge;
    }

    /* Check if any black cell block must be a full hint, in that case isolate it with white cells */
    let blockLeft = /** @type {number | undefined} */ (undefined);
    for (let x = 0; x <= lineLength; x++) {
        /* Handle out of bounds by acting as if it were a white square */
        const state = x < lineLength ? newKnowledge.cells[x] : CellKnowledge.DEFINITELY_WHITE;

        /* On block start: Mark block start, move to end */
        if (state == CellKnowledge.DEFINITELY_BLACK) {
            if (!blockLeft) {
                blockLeft = x;
            }

            continue;
        }

        /* On nonblack block: Just continue if this is not marking a block end */
        if (!blockLeft) {
            continue;
        }

        /* x marks a block end. Find corresponding hints in left and right solution. */
        const lHintIdx = findLastPredecessorIdx(lSol, blockLeft);
        const rHintIdx = findLastPredecessorIdx(rSol, blockLeft);


        /* Check if all hints that can cover this block have the same length as the block. */
        const blockLength = x - blockLeft;
        let blockIsDone = true;
        for (let i = Math.min(lHintIdx, rHintIdx); i <= Math.max(lHintIdx, rHintIdx); i++) {
            if (hints[i] > blockLength) {
                blockIsDone = false;
                break;
            }
        }

        if (!blockIsDone) {
            blockLeft = undefined;
            continue;
        }

        /* Block is a full hint. Mark left and right of it as white. */
        if (blockLeft - 1 >= 0) {
            newKnowledge.cells[blockLeft - 1] = CellKnowledge.DEFINITELY_WHITE;
        }

        if (x < lineLength) {
            newKnowledge.cells[x] = CellKnowledge.DEFINITELY_WHITE;
        }

        blockLeft = undefined;
    }

    /* Check if any deduction was made at all and if the line is solved. */
    let allSolved = true;
    let anyChanged = false;
    for (let x = 0; x < lineLength; x++) {
        allSolved = allSolved && newKnowledge.cells[x] != CellKnowledge.UNKNOWN;
        anyChanged = anyChanged || newKnowledge.cells[x] != lineKnowledge.cells[x];
    }

    /* Done */
    if (!anyChanged) {
        const status = allSolved ? DeductionStatus.WAS_SOLVED : DeductionStatus.COULD_NOT_DEDUCE;
        return new LineDeductionResult(status, null);
    } else {
        return new LineDeductionResult(DeductionStatus.DEDUCTION_MADE, newKnowledge);
    }
}

class ContainedBlockResult {
    /**
     * @param {number} hintIdx 
     * @param {boolean} isGap 
     */
    constructor(hintIdx, isGap) {
        this.hintIdx = hintIdx;
        this.isGap = isGap;
    }
}

/**
 * Returns
 * 
 * @param {number} x 
 * @param {Array<number>} hints 
 * @param {Array<number>} solution 
 * @returns {ContainedBlockResult}
 */
function calcContainedBlock(x, hints, solution) {
    if (hints.length != solution.length) {
        throw new Error("Solution must have as many entries as there are hints");
    }

    const idx = findLastPredecessorIdx(solution, x);
    const isGap = idx == -1 || x >= solution[idx] + hints[idx];

    return new ContainedBlockResult(idx, isGap);
}

/**
 * Finds the rightmost valid solution for the given line.
 * 
 * @param {LineKnowledge} lineKnowledge 
 * @param {Array<number>} hints
 * @returns {Array<number> | undefined}
 */
function rightmostSolution(lineKnowledge, hints) {
    const lineLength = lineKnowledge.cells.length;

    /* Reverse line and simply use leftSol(...) */
    const reversedLine = new LineKnowledge([...lineKnowledge.cells].reverse());
    const reversedHints = [...hints].reverse();
    const reversedSolution = leftmostSolution(reversedLine, reversedHints);

    /* Just return if no solution */
    if (!reversedSolution) {
        return undefined;
    }

    /* Each number in the solution currently points to the leftmost cell in the _reversed_ view, we need to fix that */
    for (let i = 0; i < reversedSolution.length; i++) {
        reversedSolution[i] = lineLength - reversedSolution[i] - hints[hints.length - i - 1];
    }

    /* Create solution for original line */
    return reversedSolution.reverse();
}

/**
 * Finds the leftmost valid solution for the given line.
 * 
 * @param {LineKnowledge} lineKnowledge
 * @param {Array<number>} hints
 * @param {number} lineIdx
 * @param {number} hintIdx
 * @param {Map<String, Array<number> | undefined>} memory
 * @returns {Array<number> | undefined}
 */
function leftmostSolution( lineKnowledge, hints, lineIdx = 0, hintIdx = 0, memory = new Map()) {
    const memKey = lineIdx + "," + hintIdx;
    if (memory.has(memKey)) {
        return memory.get(memKey);
    }

    const lineLength = lineKnowledge.cells.length;
    const hint = hints[hintIdx];
    
    /* Base case: No hints */
    if (!hint) {
        for (let i = lineIdx; i < lineLength; i++) {
            if (lineKnowledge.cells[i] == CellKnowledge.DEFINITELY_BLACK) {
                memory.set(memKey, undefined);
                return undefined;
            }
        }
        
        memory.set(memKey, []);
        return [];
    }
    
    const numRemainingHints = hints.length - hintIdx;
    const remainingHintSum = hints.slice(hintIdx).reduce((a, b) => a + b, 0);
    const minHintTotal = remainingHintSum + numRemainingHints - 1;
    const maxHintX = lineLength - minHintTotal;
    
    /* Try every valid position of this hint, starting from left */
    for (let x = lineIdx; x <= maxHintX; x++) {
        /* Check validity of placement */
        let valid = true;
        for (let i = x; i < x + hint; i++) {
            /* Invalid if a hint cell is definitely white */
            if (i < lineLength && lineKnowledge.cells[i] == CellKnowledge.DEFINITELY_WHITE) {
                valid = false; break;
            }
        }
        
        /* Invalid if cell next to hint is definitely black */
        if (x + hint < lineLength && lineKnowledge.cells[x + hint] == CellKnowledge.DEFINITELY_BLACK) {
            valid = false;
        }
        
        /* Invalid if any cell before hint if definitely black */
        for (let i = x - 1; i >= lineIdx; i--) {
            if (lineKnowledge.cells[i] == CellKnowledge.DEFINITELY_BLACK) {
                valid = false;
            }
        }
        
        /* Skip invalid placements */
        if (!valid) {
            continue;
        }
        
        /* Find leftmost solution for remaining line */
        const remainingSolution = leftmostSolution(lineKnowledge, hints, x + hint + 1, hintIdx + 1, memory);
        if (!remainingSolution) {
            continue;
        }
        
        const finalSolution = [x];
        remainingSolution.forEach(pos => finalSolution.push(pos));
        memory.set(memKey, finalSolution);
        return finalSolution;
    }
    
    memory.set(memKey, undefined);
    return undefined;
}

/**
 * Returns the index of the last element in arr that is smaller than or equal to x. If x is smaller than all elements, 
 * returns -1.
 * 
 * @param {Array<number>} arr 
 * @param {number} x 
 * @returns {number}
 */
function findLastPredecessorIdx(arr, x) {
    if (arr.length == 0 || arr[0] > x) {
        return -1;
    }

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i + 1] > x) {
            return i;
        }
    }

    return arr.length - 1;
}

/**
 * Really shitty priority queue
 *
 * @template T
 */
class PriorityQueue {
    /** @type {Array<PriorityQueueEntry<T>>} */
    #arr = [];

    #keyFunc;

    /**
     * @param {(val: T) => number} keyFunc 
     */
    constructor(keyFunc) {
        this.#keyFunc = keyFunc;
    }

    /**
     * Adds an element to the queue.
     * 
     * @param {T} value 
     */
    push(value) {
        const key = this.#keyFunc(value);
        let i = 0;
        
        /* Move to first entry with a larger key */
        while (i < this.#arr.length && this.#arr[i].key < key) {
            i += 1;
        }

        /* Insert there */
        const entry = new PriorityQueueEntry(value, key);
        this.#arr.splice(i, 0, entry);
    }

    /**
     * Returns the element with the largest key from the queue.
     * 
     * @returns {T | undefined}
     */
    pop() {
        return this.#arr.pop()?.value;
    }

    size() {
        return this.#arr.length;
    }

    get arr() {
        return this.#arr.map(entry => entry.value);
    }
}

/**
 * @template T
 */
class PriorityQueueEntry {
    #value;
    #key;

    /**
     * 
     * @param {T} value 
     * @param {number} key 
     */
    constructor(value, key) {
        this.#value = value;
        this.#key = key;
    }

    get value() {
        return this.#value;
    }

    get key() {
        return this.#key;
    }
}