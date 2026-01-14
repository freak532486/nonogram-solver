import * as storage from "../storage.js"
import { CellKnowledge, DeductionStatus, LineId, LineKnowledge, LineType, NonogramState, SingleDeductionResult } from "../common/nonogram-types.js";
import { Point } from "../common/point.js";
import { loadHtml } from "../loader.js";
import { Menu } from "../menu/menu.component.js";
import { checkHints, deduceAll, deduceNext, HintCheckResult } from "../solver.js";
import { ControlPad, ControlPadButton } from "./control-pad/control-pad.component.js";
import { MessageBox } from "./message-box/message-box.component.js";
import { BoardComponentFullState, NonogramBoardComponent } from "./nonogram-board/nonogram-board.component.js";
import { ZoomWindow } from "./zoom-window/zoom-window.component.js";

import playfield from "./playfield.html"
import "./playfield.css"
import { LineIdSet } from "../common/line-id-set.js";

export class PlayfieldComponent {

    /** @type {string} */
    #nonogramId;

    /** @type {HTMLElement | null} */
    #view = null;

    /** @type {NonogramBoardComponent} */
    #nonogramBoard;

    #messageBox = new MessageBox();

    /** @type {ControlPad | null} */
    #controlPad = null;
    #line = /** @type {Array<Point>} */ ([]);
    #lineType = /** @type {CellKnowledge | null} */ (null);

    /** @type {Array<BoardComponentFullState>} */
    #stateHistory = [];
    #activeStateIdx = 0;

    #menu;

    #onExit = () => {};

    /**
     * Constructs a playfield for the given nonogram. Call init() before using!
     * 
     * @param {string} nonogramId
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints 
     * @param {Menu} menu;
     */
    constructor (nonogramId, rowHints, colHints, menu) {
        this.#nonogramId = nonogramId;
        this.#nonogramBoard = new NonogramBoardComponent(rowHints, colHints);
        this.#menu = menu;

        /* Add hint button */
        const hintButton = document.createElement("button");
        hintButton.classList.add("entry", "playfield", "border-right", "border-top");
        hintButton.textContent = "Hint";
        hintButton.onclick = () => {
            menu.toggle();

            const state = this.#extractSolverState();
            const deduction = deduceNext(state);

            if (deduction.status == DeductionStatus.DEDUCTION_MADE) {
                this.#messageBox.showMessage("You can make a deduction in " + deduction.lineId + ".");
            } else {
                this.#messageBox.showMessage(getTextForStatus(deduction.status));
            }
        };
        menu.appendElement(hintButton);

        /* Add Solve Line button */
        const nextButton = document.createElement("button");
        nextButton.classList.add("entry", "playfield", "border-top");
        nextButton.textContent = "Deduce next";
        nextButton.onclick = () => {
            menu.toggle();
            
            const state = this.#extractSolverState();
            const deduction = deduceNext(state);

            if (deduction.status == DeductionStatus.DEDUCTION_MADE) {
                this.#messageBox.showMessage("Deduction made in " + deduction.lineId + ".");
            } else {
                this.#messageBox.showMessage(getTextForStatus(deduction.status));
                return;
            }

            state.applyDeduction(deduction);

            const oldState = this.#nonogramBoard.getFullState().cells;
            this.#nonogramBoard.applyState(new BoardComponentFullState(
                state.getCellStates(),
                this.#nonogramBoard.getFullState().finishedRowHints,
                this.#nonogramBoard.getFullState().finishedColHints,
                this.#nonogramBoard.getFullState().errorLines
            ));
            this.#recheckLineHints(oldState);
            this.#updateHistory();
        };
        menu.appendElement(nextButton);

        /* Add full solve button */
        const solveButton = document.createElement("button");
        solveButton.classList.add("entry", "playfield", "border-top", "border-right" );
        solveButton.textContent = "Solve";
        solveButton.onclick = () => {
            menu.toggle();
            
            const state = this.#extractSolverState();
            const deduction = deduceAll(state);

            this.#messageBox.showMessage(getTextForStatus(deduction.status));

            const oldState = this.#nonogramBoard.getFullState().cells;
            this.#nonogramBoard.applyState(new BoardComponentFullState(
                deduction.newState.getCellStates(),
                this.#nonogramBoard.getFullState().finishedRowHints,
                this.#nonogramBoard.getFullState().finishedColHints,
                this.#nonogramBoard.getFullState().errorLines
            ));
            this.#recheckLineHints(oldState);
            
            this.#updateHistory();
            if (deduction.status !== DeductionStatus.WAS_SOLVED) {
                return;
            }
        };
        menu.appendElement(solveButton);

        /* Add reset button */
        const resetButton = document.createElement("button");
        resetButton.classList.add("entry", "playfield", "border-top");
        resetButton.textContent = "Reset";
        resetButton.onclick = () => {
            menu.toggle();

            const emptyState = (BoardComponentFullState.empty(
                this.#nonogramBoard.width,
                this.#nonogramBoard.height
            ));

            this.#nonogramBoard.applyState(emptyState);
            storage.storeState(nonogramId, new storage.SaveState(emptyState.cells));
            this.#stateHistory = [emptyState];
            this.#activeStateIdx = 0;
            this.controlPad.getButton(ControlPadButton.UNDO).style.visibility = "hidden";
            this.controlPad.getButton(ControlPadButton.REDO).style.visibility = "hidden";
        }
        menu.appendElement(resetButton);

        /* Add exit button */
        const exitButton = document.createElement("button");
        exitButton.classList.add("entry", "playfield", "border-top", "border-right");
        exitButton.textContent = "Exit";
        exitButton.style.gridColumn = "1 / 3";
        exitButton.style.color = "#ff3b3bff";
        exitButton.onclick = () => {
            menu.toggle();
            this.#onExit();
        }
        menu.appendElement(exitButton);

        /* Apply stored state if exists */
        const storedState = storage.retrieveStoredState(this.#nonogramId);
        if (storedState) {
            this.#nonogramBoard.applyState(new BoardComponentFullState(
                storedState.cells,
                Array(this.#nonogramBoard.height).fill(null).map(() => []),
                Array(this.#nonogramBoard.width).fill(null).map(() => []),
                []
            ));
        }

        /* Recheck hints */
        const emptyState = Array(this.#nonogramBoard.width * this.#nonogramBoard.height).fill(CellKnowledge.UNKNOWN);
        this.#recheckLineHints(emptyState);

        /* Prepare history */
        this.#stateHistory.push(this.#nonogramBoard.getFullState());
    }

    /** Should be called after removing the playfield from the screen */
    destroy() {
        this.#menu.removeElement("playfield");
    }

    /**
     * Initializes this component and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Create view */
        this.#view = await loadHtml(playfield);
        parent.appendChild(this.#view);

        /* Create control pad */
        const footer = /** @type {HTMLElement} */ (this.view.querySelector("#footer"));
        const controlPad = new ControlPad();
        await controlPad.init(footer);

        controlPad.setButtonFunction(ControlPadButton.LEFT, () => this.#moveSelectionAndSet(-1, 0));
        controlPad.setButtonFunction(ControlPadButton.UP, () => this.#moveSelectionAndSet(0, -1));
        controlPad.setButtonFunction(ControlPadButton.RIGHT, () => this.#moveSelectionAndSet(1, 0));
        controlPad.setButtonFunction(ControlPadButton.DOWN, () => this.#moveSelectionAndSet(0, 1));
        controlPad.setButtonFunction(ControlPadButton.ERASE, () => {
            const x = this.#nonogramBoard.selection.x;
            const y = this.#nonogramBoard.selection.y;
            const curState = this.#nonogramBoard.getFullState().cells;

            if (this.#nonogramBoard.getCellState(x, y) == CellKnowledge.UNKNOWN) {
                return;
            }
            
            this.#nonogramBoard.setCellState(x, y, CellKnowledge.UNKNOWN);
            this.#recheckLineHints(curState);
            this.#updateHistory();
        })

        controlPad.setButtonFunction(ControlPadButton.BLACK, () => {
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isBlackChecked()) {
                    /* Clear previous white line */
                    if (this.#lineType == CellKnowledge.DEFINITELY_WHITE) {
                        this.#line.length = 0;
                    }

                    this.#lineType = CellKnowledge.DEFINITELY_BLACK;
                    this.#supplyNextLineSegment(p);
                } else if (this.#lineType != null) {
                    this.#applyLine();
                }
        });
        controlPad.setButtonFunction(ControlPadButton.WHITE, () => { 
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isWhiteChecked()) {
                    /* Clear previous white line */
                    if (this.#lineType == CellKnowledge.DEFINITELY_BLACK) {
                        this.#line.length = 0;
                    }

                    this.#lineType = CellKnowledge.DEFINITELY_WHITE;
                    this.#supplyNextLineSegment(p);
                } else if (this.#lineType != null) {
                    this.#applyLine();
                }
        });

        this.#controlPad = controlPad;

        /* Create zoomable window */
        const nonogramRoot = /** @type {HTMLElement} */ (this.#view.querySelector("#nonogram-root"));
        const zoomWindow = new ZoomWindow(this.#nonogramBoard.view, nonogramRoot);
        this.#nonogramBoard.init(zoomWindow.view);

        const undoButton = controlPad.getButton(ControlPadButton.UNDO);
        const redoButton = controlPad.getButton(ControlPadButton.REDO);

        undoButton.style.visibility = "hidden";
        redoButton.style.visibility = "hidden";

        /* Create message box */
        await this.#messageBox.init(zoomWindow.view);

        /* Undo and redo */
        undoButton.onclick = () => {
            if (this.#activeStateIdx == 0) {
                undoButton.style.visibility = "hidden";
                return;
            }

            this.#activeStateIdx -= 1;
            this.#nonogramBoard.applyState(this.#stateHistory[this.#activeStateIdx]);
            undoButton.style.visibility = (this.#activeStateIdx == 0) ? "hidden" : "visible";
            redoButton.style.visibility = "visible";
        };

        redoButton.onclick = () => {
            if (this.#activeStateIdx == this.#stateHistory.length - 1) {
                return;
            }

            this.#activeStateIdx += 1;
            this.#nonogramBoard.applyState(this.#stateHistory[this.#activeStateIdx]);
            undoButton.style.visibility = "visible";
            redoButton.style.visibility = (this.#activeStateIdx == this.#stateHistory.length - 1) ? "hidden" : "visible";
        };
    }

    #applyLine() {
        /* Nothing to do if there is no line */
        if (!this.#lineType) {
            return;
        }

        /* Remember already checked lines */
        const width = this.#nonogramBoard.width;
        const curState = this.#nonogramBoard.getFullState().cells;
        const newState = [...curState];

        for (const p of this.#line) {
            /* Nothing to do if no change */
            if (curState[p.x + p.y * width] == this.#lineType) {
                continue;
            }
            
            /* Change state */
            newState[p.x + p.y * width] = this.#lineType;
        }

        /* Perform checks */
        this.#nonogramBoard.applyState(new BoardComponentFullState(
            newState,
            this.#nonogramBoard.getFullState().finishedRowHints,
            this.#nonogramBoard.getFullState().finishedColHints,
            this.#nonogramBoard.getFullState().errorLines
        ));
        this.#recheckLineHints(curState);

        /* Update history and clear line */
        this.#updateHistory();

        this.#line = [];
        this.#lineType = null;
        this.#nonogramBoard.clearLinePreview();
    }

    /**
     * Supplies the next line segment. This could:
     * 
     * - Extend the current line by one or multiple segments.
     * - Remove a part of the line (user went backwards)
     * - Clear the line completely (user broke the line).
     * 
     * @param {Point} p 
     */
    #supplyNextLineSegment(p) {
        if (this.#lineType == null) {
            return; // Nothing to do if no line is active.
        }
        
        const line = this.#line;

        /* Easy case: This is a new line */
        if (line.length == 0) {
            line.push(p);
            this.#nonogramBoard.updateLinePreview(line, this.#lineType);
            return;
        }

        /* Check difference between latest point and new point */
        const q0 = line[0];
        const q1 = line[line.length - 1];
        const dx = p.x - q1.x;
        const dy = p.y - q1.y;
        const expectedHorizontal = line.length > 1 && (q1.y - q0.y == 0);
        const expectedVertical = line.length > 1 && (q1.x - q0.x == 0);

        /* Nothing to do if no change was made. */
        if (dx == 0 && dy == 0) {
            return;
        }

        /* Line is "broken" if both axis are off */
        if (dx != 0 && dy != 0 || expectedHorizontal && dy != 0 || expectedVertical && dx != 0) {
            this.#line.length = 0;
            this.#lineType = null;
            this.#nonogramBoard.clearLinePreview();

            const controlPad = /** @type {ControlPad} */ (this.#controlPad);
            controlPad.setBlackChecked(false);
            controlPad.setWhiteChecked(false);
            return;
        }

        /* Separate handling for horizontal and vertical line */
        if (dx != 0) {
            /* Check if this move adds to or removes from the line */
            const isAddition = Math.sign(dx) == Math.sign(q1.x - q0.x) || this.#line.length == 1;

            /* Perform addition or subtraction */
            if (isAddition) {
                while (line[line.length - 1].x != p.x) {
                    line.push(new Point(line[line.length - 1].x + Math.sign(dx), p.y));
                }
                
            } else {
                while (line[line.length - 1].x != p.x) {
                    line.pop();
                }
            }
        } else {
            /* Check if this move adds to or removes from the line */
            const isAddition = Math.sign(dy) == Math.sign(q1.y - q0.y) || this.#line.length == 1;

            /* Perform addition or subtraction */
            if (isAddition) {
                while (line[line.length - 1].y != p.y) {
                    line.push(new Point(p.x, line[line.length - 1].y + Math.sign(dy)));
                }
            } else {
                while (line[line.length - 1].y != p.y) {
                    line.pop();
                }
            }
        }

        /* Finalize line */
        this.#nonogramBoard.updateLinePreview(line, this.#lineType);
    }

    /**
     * Moves the selection on the nonogram board and extends the current line.
     * 
     * @param {number} dx 
     * @param {number} dy 
     */
    #moveSelectionAndSet(dx, dy) {
        this.#nonogramBoard.moveSelection(dx, dy);
        this.#supplyNextLineSegment(this.#nonogramBoard.selection);
    }

    #extractSolverState() {
        const activeState = [...this.#stateHistory[this.#activeStateIdx].cells];

        return new NonogramState(
            this.#nonogramBoard.width,
            this.#nonogramBoard.height,
            this.#nonogramBoard.rowHints,
            this.#nonogramBoard.colHints,
            activeState
        );
    }

    /**
     * Adds the current state of the board into the history.
     */
    #updateHistory() {
        const lastState = this.#stateHistory[this.#stateHistory.length - 1];
        const curState = this.#nonogramBoard.getFullState();

        if (lastState.equals(curState)) {
            return; // Nothing to do
        }

        storage.storeState(this.#nonogramId, new storage.SaveState(curState.cells));

        const undoButton = this.controlPad.getButton(ControlPadButton.UNDO);
        const redoButton = this.controlPad.getButton(ControlPadButton.REDO);

        while (this.#stateHistory.length != this.#activeStateIdx + 1) {
            this.#stateHistory.pop();
        }

        this.#stateHistory.push(this.#nonogramBoard.getFullState());
        this.#activeStateIdx += 1;
        undoButton.style.visibility = "visible";
        redoButton.style.visibility = "hidden";
    }

    /**
     * Rechecks the line hints for all changed lines between the current state and the given previous state.
     * 
     * @param {Array<CellKnowledge>} prevState 
     */
    #recheckLineHints(prevState) {
        /* Placing crosses for hints can cause other deductions, so this happens in a loop */
        const LOOP_LIMIT = 50;

        let actualPrevState = prevState;
        for (let i = 0; i < LOOP_LIMIT; i++) {
            /* Compare with previous state and deduce all changed lines */
            const curState = this.#nonogramBoard.getFullState().cells;
            const changed = calcChangedLines(this.#nonogramBoard.width, this.#nonogramBoard.height, actualPrevState, curState);
            if (changed.size == 0) {
                break;
            }

            for (const line of changed.asArray()) {
                const lineKnowledge = this.getLineKnowledge(line);
                const hints = this.getHints(line);
                this.#applyHintCheckDeduction(line, checkHints(lineKnowledge, hints));
            }

            /* Next comparison goes against the current state (after hint deduction) */
            actualPrevState = curState;
        }

        console.error("Canceled hint checking after " + LOOP_LIMIT + " iterations");
    }

    /**
     * Returns the current line knowledge of the given line.
     * 
     * @param {LineId} lineId
     * @returns {LineKnowledge}
     */
    getLineKnowledge(lineId) {
        return this.#nonogramBoard.getLineState(lineId);
    }

    /**
     * Returns the hints for the given line.
     * 
     * @param {LineId} lineId 
     * @returns {Array<number>}
     */
    getHints(lineId) {
        const relevantHints = lineId.lineType == LineType.ROW ?
            this.#nonogramBoard.rowHints :
            this.#nonogramBoard.colHints;
        
        return relevantHints[lineId.index];
    }

    /**
     * 
     * @param {LineId} lineId 
     * @param {HintCheckResult | undefined} deduction 
     */
    #applyHintCheckDeduction(lineId, deduction) {
        /* If no deduction possible, mark an error for this line */
        if (!deduction) {
            this.#nonogramBoard.markError(lineId, true);
            return;
        }

        /* Update finished hints and apply new knowledge */
        this.#nonogramBoard.markError(lineId, false);
        this.#nonogramBoard.updateFinishedHints(lineId, deduction.finishedHints);
        this.#nonogramBoard.applyLineKnowledge(lineId, deduction.newKnowledge);
    }

    get view() {
        if (this.#view == null) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    get controlPad() {
        if (this.#controlPad == null) {
            throw new Error("init() was not called");
        }

        return this.#controlPad;
    }

    /** @param {() => void} fn */
    set onExit(fn) {
        this.#onExit = fn;
    }

};

/**
 * Returns an appropriate status text for the given deduction status.
 * 
 * @param {DeductionStatus} status
 * @returns {String}
 */
function getTextForStatus(status) {
    switch (status) {
        case DeductionStatus.COULD_NOT_DEDUCE: return "Solver could not make a deduction.";
        case DeductionStatus.DEDUCTION_MADE: return "A deduction was made.";
        case DeductionStatus.WAS_IMPOSSIBLE: return "Puzzle is impossible.";
        case DeductionStatus.WAS_SOLVED: return "Puzzle is solved.";
        case DeductionStatus.TIMEOUT: return "Solver timeout.";
    }

    throw new Error("Unknown status: " + status);
}

/**
 * Calculates which lines have changed between the two states.
 * 
 * @param {number} width
 * @param {number} height 
 * @param {Array<CellKnowledge>} oldState
 * @param {Array<CellKnowledge>} newState
 * @returns {LineIdSet} 
 */
function calcChangedLines(width, height, oldState, newState) {
    const ret = new LineIdSet();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (oldState[x + y * width] !== newState[x + y * width]) {
                ret.add(new LineId(LineType.ROW, y));
                ret.add(new LineId(LineType.COLUMN, x));
            }
        }
    }

    return ret;
}