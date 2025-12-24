import { UserInput as UserInput } from "./types/input-data.js";
import { NonogramInput } from "./types/nonogram-types.js";

/* Constants */
export const NONOGRAM_CELL_SIZE = "20px";

/* DOM elements */
export const btnSolve = /** @type {!HTMLElement} */ (document.getElementById("btn-solve"));
export const btnHint = /** @type {!HTMLElement} */ (document.getElementById("btn-hint"));
export const btnReset = /** @type {!HTMLElement} */ (document.getElementById("btn-reset"));

export const inputNumRows = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-rows"));
export const inputNumCols = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-cols"));

export const inputRowHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-row-hints"));
export const inputColHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-col-hints"));

export const errlabelRowHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-row-hints"));
export const errlabelColHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-col-hints"));

export const nonogramContainer = /** @type {!HTMLElement} */ (document.getElementById("nonogram-container"));

/**
 * Parsed content of input components.
 */
let userInput = new UserInput();

/**
 * Returns the current user input state.
 * 
 * @returns {UserInput}
 */
export function getUserInput() {
    return userInput;
}

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
 * @param {} input 
 */
export function setSolverInput(input) {
    solverInput = input;
}

