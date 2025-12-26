import { UserInput as UserInput } from "./types/input-data.js";
import { NonogramInput } from "./types/nonogram-types.js";

/* Constants */
export const NONOGRAM_CELL_SIZE = "20px";
export const NONOGRAM_CELL_SIZE_CLICKED = "16px";


/**
 * Current nonogram state for solver. Is 'null' if not initialized.
 * 
 * @type {NonogramInput | null}
 */
let solverInput = null;

/**
 * Returns true if the solver input was initialized.
 * 
 * @returns {boolean}
 */
export function isSolverInputInitialized() {
    return solverInput != null;
}

/**
 * Returns the current nonogram solver input.
 * @returns {NonogramInput} 
 */
export function getSolverInput() {
    if (solverInput == null) {
        throw new Error("Solver input was not intialized.");
    }

    return solverInput;
}

/**
 * Sets the current nonogram solver input.
 * @param {NonogramInput} input 
 */
export function setSolverInput(input) {
    solverInput = input;
}

