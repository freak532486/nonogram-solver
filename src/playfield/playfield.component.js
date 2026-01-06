import { CellKnowledge, DeductionStatus, NonogramState } from "../common/nonogram-types.js";
import { Point } from "../common/point.js";
import { attachCss, loadHtml } from "../loader.js";
import { deduceAll, deduceNext } from "../solver.js";
import { ControlPad, ControlPadButton } from "./control-pad/control-pad.component.js";
import { MenuButton, PlayfieldMenu } from "./menu/playfield-menu.component.js";
import { BoardComponentFullState, NonogramBoardComponent } from "./nonogram-board/nonogram-board.component.js";
import { ZoomWindow } from "./zoom-window/zoom-window.component.js";

export class PlayfieldComponent {

    /** @type {HTMLElement | null} */
    #view = null;

    /** @type {NonogramBoardComponent} */
    #nonogramBoard;

    /** @type {ZoomWindow | null} */
    #zoomWindow = null;

    /** @type {ControlPad | null} */
    #controlPad = null;
    #line = /** @type {Array<Point>} */ ([]);
    #lineType = /** @type {CellKnowledge | null} */ (null);

    /** @type {PlayfieldMenu | null} */
    #menu = null;
    #onExit = () => {};

    #undoButton = /** @type {HTMLElement | null} */ (null);
    #redoButton = /** @type {HTMLElement | null} */ (null);

    /** @type {Array<BoardComponentFullState>} */
    #stateHistory = [];
    #activeStateIdx = 0;

    /**
     * Constructs a playfield for the given nonogram. Call init() before using!
     * 
     * @param {Array<Array<number>>} rowHints 
     * @param {Array<Array<number>>} colHints 
     */
    constructor (rowHints, colHints) {
        this.#nonogramBoard = new NonogramBoardComponent(rowHints, colHints);
        this.#stateHistory.push(this.#nonogramBoard.getFullState());
    }

    /**
     * Initializes this component and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Create view */
        attachCss(new URL("./playfield.css", import.meta.url));
        this.#view = await loadHtml(new URL("./playfield.html", import.meta.url));
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
            this.#nonogramBoard.setCellState(
                this.#nonogramBoard.selection.x,
                this.#nonogramBoard.selection.y,
                CellKnowledge.UNKNOWN
            );
            this.#updateHistory();
        })

        controlPad.setButtonFunction(ControlPadButton.BLACK, () => {
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isBlackChecked()) {
                    controlPad.getButton(ControlPadButton.WHITE).checked = false;
                    
                    /* Clear previous white line */
                    if (this.#lineType == CellKnowledge.DEFINITELY_WHITE) {
                        this.#line.length = 0;
                    }

                    this.#lineType = CellKnowledge.DEFINITELY_BLACK;
                    this.#supplyNextLineSegment(p);
                } else if (this.#lineType != null) {
                    /* Apply line */
                    for (const p of this.#line) {
                        this.#nonogramBoard.setCellState(p.x, p.y, this.#lineType);
                    }
                    this.#updateHistory();

                    /* Clear line */
                    this.#lineType = null;
                    this.#line.length = 0;
                    this.#nonogramBoard.clearLinePreview();
                }
        });
        controlPad.setButtonFunction(ControlPadButton.WHITE, () => { 
                const p = this.#nonogramBoard.selection;
                if (!controlPad.isWhiteChecked()) {
                    controlPad.getButton(ControlPadButton.BLACK).checked = false;
                    
                    /* Clear previous white line */
                    if (this.#lineType == CellKnowledge.DEFINITELY_BLACK) {
                        this.#line.length = 0;
                    }

                    this.#lineType = CellKnowledge.DEFINITELY_WHITE;
                    this.#supplyNextLineSegment(p);
                } else if (this.#lineType != null) {
                    /* Apply line */
                    for (const p of this.#line) {
                        this.#nonogramBoard.setCellState(p.x, p.y, this.#lineType);
                    }
                    this.#updateHistory();

                    /* Clear line */
                    this.#lineType = null;
                    this.#line.length = 0;
                    this.#nonogramBoard.clearLinePreview();
                }
        });

        this.#controlPad = controlPad;

        /* Create zoomable window */
        const nonogramRoot = /** @type {HTMLElement} */ (this.#view.querySelector("#nonogram-root"));
        this.#zoomWindow = new ZoomWindow(this.#nonogramBoard.view, nonogramRoot);

        /* Create menu */
        this.#menu = new PlayfieldMenu();
        await this.#menu.init(this.#view);

        /* Make menu toggle-able */
        const menuButton = /** @type {HTMLElement} */ (this.#view.querySelector("#button-menu"));
        menuButton.onclick = () => this.#menu?.isHidden() ? this.#menu.show() : this.#menu?.hide();

        /* Hide menu if anywhere inside the window is clicked */
        this.#zoomWindow.view.addEventListener("click", ev => {
            this.#menu?.hide();
        });

        const undoButton = /** @type {HTMLElement} */ (this.#view.querySelector("#button-undo"));
        const redoButton = /** @type {HTMLElement} */ (this.#view.querySelector("#button-redo"));
        this.#undoButton = undoButton;
        this.#redoButton = redoButton;

        undoButton.style.visibility = "hidden";
        redoButton.style.visibility = "hidden";

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

        /* Reset button */
        this.#menu.setButtonFunction(MenuButton.RESET, () => {
            /* Reset to first state */
            while (this.#stateHistory.length > 1) {
                this.#stateHistory.pop();
            }

            this.#activeStateIdx = 0;
            this.#nonogramBoard.applyState(this.#stateHistory[0]);
            undoButton.style.visibility = "hidden";
            redoButton.style.visibility = "hidden";
            this.#setStatusText("");
        });

        /* Solver */
        this.#menu.setButtonFunction(MenuButton.HINT, () => {
            const solverState = this.#extractSolverState();
            const deduction = deduceNext(solverState);

            this.#setStatusText(getTextForStatus(deduction.status));

            if (deduction.status == DeductionStatus.DEDUCTION_MADE) {
                this.#setStatusText("Hint: A deduction can be made in " + deduction.lineId + ".");
            }
        });

        this.#menu.setButtonFunction(MenuButton.SOLVE_LINE, () => {
            const solverState = this.#extractSolverState();
            const deduction = deduceNext(solverState);

            this.#setStatusText(getTextForStatus(deduction.status));
            if (deduction.status != DeductionStatus.DEDUCTION_MADE) {
                return;
            }

            const newState = NonogramState.clone(solverState);
            newState.applyDeduction(deduction);

            const fullState = new BoardComponentFullState(newState.getCellStates());
            this.#supplyNextState(fullState);
        });

        this.#menu.setButtonFunction(MenuButton.SOLVE, () => {
            const solverState = this.#extractSolverState();
            const deduction = deduceAll(solverState);

            this.#setStatusText(getTextForStatus(deduction.status));
            const fullState = new BoardComponentFullState(deduction.newState.getCellStates());
            this.#supplyNextState(fullState);
        });

        /* Exit */
        this.#menu.setButtonFunction(MenuButton.EXIT, () => this.#onExit());
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
            controlPad.getButton(ControlPadButton.BLACK).checked = false;
            controlPad.getButton(ControlPadButton.WHITE).checked = false;
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
     * Moves the selection on the nonogram board. If drawing is toggled, this also sets a cell.
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
     * Sets the status text in the header.
     * 
     * @param {string} msg 
     */
    #setStatusText(msg) {
        if (!this.#view) {
            throw new Error("init() was not called.");
        }

        const header = /** @type {HTMLElement} */ (this.#view.querySelector("#header"));
        header.textContent = msg;
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

        const undoButton = /** @type {HTMLElement} */ (this.#undoButton);
        const redoButton = /** @type {HTMLElement} */ (this.#redoButton);

        while (this.#stateHistory.length != this.#activeStateIdx + 1) {
            this.#stateHistory.pop();
        }

        this.#stateHistory.push(this.#nonogramBoard.getFullState());
        this.#activeStateIdx += 1;
        undoButton.style.visibility = "visible";
        redoButton.style.visibility = "hidden";
    }

    /**
     * Adds a new state to the history.
     * 
     * @param {BoardComponentFullState} state 
     */
    #supplyNextState(state) {
        this.#nonogramBoard.applyState(state);
        this.#updateHistory();
    }

    get view() {
        if (this.#view == null) {
            throw new Error("init() was not called");
        }

        return this.#view;
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