import { CellKnowledge, NonogramState } from "../common/nonogram-types";
import { htmlToElement } from "../loader";
import nonogramPreview from "./nonogram-preview.html";

const CELL_SIZE_PX = 16;

export class NonogramPreview {

    #nonogram;

    /** @type {HTMLCanvasElement | undefined} */
    #view;

    #maxWidth;
    #maxHeight;

    /**
     * 
     * @param {NonogramState} nonogram 
     */
    constructor (nonogram, maxWidth = Number.MAX_VALUE, maxHeight = Number.MAX_VALUE) {
        this.#nonogram = nonogram;
        this.#maxWidth = maxWidth;
        this.#maxHeight = maxHeight;
    }

    /**
     * Intialized and attaches the preview.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Load canvas */
        this.#view = /** @type {HTMLCanvasElement} */ (await htmlToElement(nonogramPreview));
        parent.appendChild(this.#view);
        const ctx = /** @type {CanvasRenderingContext2D} */ (this.#view.getContext("2d"));

        /* Fill its parent */
        this.#view.style.width = "fit-content";
        this.#view.style.height = "fit-content";

        /* Calculate width/height for cells */
        let cellsWidth = 0;
        for (let i = 0; i < this.#nonogram.width; i++) {
            cellsWidth += CELL_SIZE_PX + (i % 5 == 0 ? 2 : 1); // Every fifth line is 2px
        }
        cellsWidth += 2; // Outer border is thick.

        let cellsHeight = 0;
        for (let i = 0; i < this.#nonogram.height; i++) {
            cellsHeight += CELL_SIZE_PX + (i % 5 == 0 ? 2 : 1); // Every fifth line is 2px
        }
        cellsHeight += 2;

        /* Calculate width/height for hints */
        const PX_PER_HINT = 16;
        const rowHintsWidth = this.#nonogram.rowHints.map(x => x.length).reduce((a, b) => a > b ? a : b) * PX_PER_HINT;
        const colHintsHeight = this.#nonogram.colHints.map(x => x.length).reduce((a, b) => a > b ? a : b) * PX_PER_HINT;

        /* Scale if necessary */
        const totalWidth = rowHintsWidth + cellsWidth + 2;
        const totalHeight = colHintsHeight + cellsHeight + 2;

        const scale = Math.min(1, Math.min(this.#maxWidth / totalWidth, this.#maxHeight / totalHeight));

        /* Set width/height */
        this.#view.width = totalWidth;
        this.#view.height = totalHeight;
        this.#view.style.transform = "scale(" + scale + ", " + scale + ")";

        /* Draw outer border */
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(1, 1);
        ctx.lineTo(1, cellsHeight + colHintsHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(1, 1);
        ctx.lineTo(cellsWidth + rowHintsWidth, 1);
        ctx.stroke();

        /* Draw vertical lines */
        ctx.strokeStyle = "black";

        const cellLeft = Array(this.#nonogram.width + 1);
        let curX = rowHintsWidth;
        for (let i = 0; i <= this.#nonogram.width; i++) {
            ctx.lineWidth = (i % 5 == 0) ? 2 : 1;
            curX += ctx.lineWidth / 2;

            ctx.beginPath();
            ctx.moveTo(curX, 0);
            ctx.lineTo(curX, cellsHeight + colHintsHeight);
            ctx.stroke();

            curX += ctx.lineWidth / 2;
            cellLeft[i] = curX;
            curX += CELL_SIZE_PX;
        }

        /* Draw horizontal lines */
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";

        let curY = colHintsHeight;
        const cellTop = Array(this.#nonogram.height + 1);
        for (let i = 0; i <= this.#nonogram.height; i++) {
            ctx.lineWidth = (i % 5 == 0) ? 2 : 1;
            curY += ctx.lineWidth / 2;

            ctx.beginPath();
            ctx.moveTo(0, curY);
            ctx.lineTo(cellsWidth + rowHintsWidth, curY);
            ctx.stroke();

            curY += ctx.lineWidth / 2;
            cellTop[i] = curY;
            curY += CELL_SIZE_PX;
        }

        /* Fill cells that are filled */
        for (let x = 0; x < this.#nonogram.width; x++) {
            for (let y = 0; y < this.#nonogram.height; y++) {
                const state = this.#nonogram.getCell(x, y);

                /* Fill a rectangle for definitely-black squares */
                if (state == CellKnowledge.DEFINITELY_BLACK) {
                    const leftX = cellLeft[x];
                    const topY = cellTop[y];

                    ctx.beginPath();
                    ctx.roundRect(leftX + 1, topY + 1, CELL_SIZE_PX - 2, CELL_SIZE_PX - 2, [2]);
                    ctx.fill();
                }

                /* Draw a cross for definitely white squares */
                if (state == CellKnowledge.DEFINITELY_WHITE) {
                    const OFFSET = 3;
                    const leftX = cellLeft[x] + OFFSET;
                    const topY = cellTop[y] + OFFSET;

                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";

                    ctx.beginPath();
                    ctx.moveTo(leftX, topY);
                    ctx.lineTo(leftX + CELL_SIZE_PX - 2 * OFFSET, topY + CELL_SIZE_PX - 2 * OFFSET);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(leftX + CELL_SIZE_PX - 2 * OFFSET, topY);
                    ctx.lineTo(leftX, topY + CELL_SIZE_PX - 2 * OFFSET);
                    ctx.stroke();
                }
            }
        }

        /* Draw hint numbers */
        ctx.font = "bold 8pt Verdana";

        /* Draw row hints */
        let hintCurY = 6 + colHintsHeight + CELL_SIZE_PX / 2;
        for (let y = 0; y < this.#nonogram.height; y++) {
            const hints = this.#nonogram.rowHints[y];
            let curX = rowHintsWidth - 2;

            for (let i = 0; i < hints.length; i++) {
                const hint = hints[hints.length - i - 1];

                ctx.textAlign = "right";
                ctx.fillText(String(hint), curX, hintCurY);

                curX -= PX_PER_HINT;
            }

            hintCurY += CELL_SIZE_PX;
            hintCurY += (y % 5 == 4) ? 2 : 1;
        }

        /* Draw column hints */
        let hintCurX = 2 + rowHintsWidth + CELL_SIZE_PX / 2;
        for (let x = 0; x < this.#nonogram.width; x++) {
            const hints = this.#nonogram.colHints[x];
            let curY = colHintsHeight - 2;

            for (let i = 0; i < hints.length; i++) {
                const hint = hints[hints.length - i - 1];

                ctx.textAlign = "center";
                ctx.fillText(String(hint), hintCurX, curY);

                curY -= PX_PER_HINT;
            }

            hintCurX += CELL_SIZE_PX;
            hintCurX += (x % 5 == 4) ? 2 : 1;
        }
    }

    destroy() {
        this.#view?.remove();
    }

    /**
     * Returns the element.
     * 
     * @returns {HTMLCanvasElement}
     */
    get view() {
        if (!this.#view) {
            throw new Error("init() not called");
        }

        return this.#view;
    }

}