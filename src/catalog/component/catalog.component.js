import { attachCss, loadHtml } from "../../loader.js";
import { loadNonograms, SerializedNonogram } from "../catalog-load.js";

export class Catalog {
    #view = /** @type {HTMLElement | null} */ (null);

    /** @type {(nonogram: SerializedNonogram) => void} */
    #onNonogramSelected = () => {};

    /**
     * Creates the catalog and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        attachCss(new URL("./catalog.css", import.meta.url));
        this.#view = await loadHtml(new URL("./catalog.html", import.meta.url));
        const entriesRoot = /** @type {HTMLElement} */ (this.#view.querySelector(".entries"));

        const loaded = await loadNonograms();
        for (const nonogram of loaded) {
            const div = await this.#createEntry(
                nonogram.name,
                nonogram.colHints.length + "x" + nonogram.rowHints.length,
                nonogram.difficulty
            );

            div.onclick = () => this.#onNonogramSelected(nonogram);
            entriesRoot.appendChild(div);
        }

        parent.appendChild(this.#view);
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called.");
        }

        return this.#view;
    }

    /**
     * Sets the callback for when a nonogram is selected.
     * 
     * @param {(nonogram: SerializedNonogram) => void} fn 
     */
    set onNonogramSelected(fn) {
        this.#onNonogramSelected = fn;
    }

    /**
     * Creates a catalog entry with the given content.
     * 
     * @param {String} name 
     * @param {String} size 
     * @param {String} difficulty 
     * @returns 
     */
    async #createEntry(name, size, difficulty) {
        const div = await loadHtml(new URL("./catalog-entry.html", import.meta.url));
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .name")).textContent = name;
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .size")).textContent = "Size: " + size;
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .difficulty")).textContent = "Difficulty: " + difficulty;
        return div;
    }
}