import { InputData } from "./types/input-data.js";

/* Constants */
export const NONOGRAM_CELL_SIZE = "40px";

/* DOM elements */
export const btnSolve = /** @type {!HTMLElement} */ (document.getElementById("btn-solve"));
export const btnHint = /** @type {!HTMLElement} */ (document.getElementById("btn-hint"));

export const inputNumRows = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-rows"));
export const inputNumCols = /** @type {!HTMLInputElement} */ (document.getElementById("input-num-cols"));

export const inputRowHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-row-hints"));
export const inputColHints = /** @type {!HTMLTextAreaElement} */ (document.getElementById("input-col-hints"));

export const errlabelRowHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-row-hints"));
export const errlabelColHints = /** @type {!HTMLElement} */ (document.getElementById("errorlabel-col-hints"));

export const nonogramContainer = /** @type {!HTMLElement} */ (document.getElementById("nonogram-container"));

/* Parsed content of inputs */
export let input = new InputData();