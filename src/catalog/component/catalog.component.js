import * as storage from "../../storage.js"
import { loadHtml } from "../../loader.js";
import { loadNonograms, SerializedNonogram } from "../catalog-load.js";
import { CellKnowledge } from "../../common/nonogram-types.js";

import catalog from "./catalog.html"
import catalogEntry from "./catalog-entry.html"
import "./catalog.css"

export class Catalog {
    #view = /** @type {HTMLElement | null} */ (null);
    #entryTemplate = /** @type {HTMLElement | null} */ (null);

    /** @type {(nonogramId: string) => void} */
    #onNonogramSelected = () => {};

    /**
     * Creates the catalog and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await loadHtml(catalog);
        this.#entryTemplate = await loadHtml(catalogEntry);
        parent.appendChild(this.#view);

        this.refresh();
    }

    /**
     * Reloads all nonograms and updates progress.
     */
    async refresh() {
        const entriesRoot = /** @type {HTMLElement} */ (this.view.querySelector(".entries"));
        entriesRoot.replaceChildren();

        const loaded = await loadNonograms();
        loaded.sort((a, b) => {
            if (a.colHints.length > b.colHints.length) {
                return 1;
            } else if (a.colHints.length < b.colHints.length) {
                return -1;
            } else {
                return a.rowHints.length - b.rowHints.length;
            }
        });
        
        const stored = storage.fetchAllStoredStates();
        for (const nonogram of loaded) {
            const numFilled = stored.get(nonogram.id)
                ?.cells
                .reduce((sum, x) => sum + (x == CellKnowledge.UNKNOWN ? 0 : 1), 0) 
                ?? 0;
                
            const numTotal = nonogram.rowHints.length * nonogram.colHints.length;
            const div = this.#createEntry(
                "#" + nonogram.id,
                nonogram.colHints.length + "x" + nonogram.rowHints.length,
                numFilled / numTotal
            );

            div.onclick = () => this.#onNonogramSelected(nonogram.id);
            entriesRoot.appendChild(div);
            
        }
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called.");
        }

        return this.#view;
    }

    get entryTemplate() {
        if (!this.#entryTemplate) {
            throw new Error("init() was not called.");
        }

        return this.#entryTemplate;
    }

    /**
     * Sets the callback for when a nonogram is selected.
     * 
     * @param {(nonogramId: string) => void} fn 
     */
    set onNonogramSelected(fn) {
        this.#onNonogramSelected = fn;
    }

    /**
     * Creates a catalog entry with the given content.
     * 
     * @param {String} id 
     * @param {String} size 
     * @param {number} progress 
     * @returns 
     */
    #createEntry(id, size, progress) {
        const div = /** @type {HTMLElement} */ (this.entryTemplate.cloneNode(true));
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .name")).textContent = id.substring(0, 6);
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .size")).textContent = size;
        /** @type {HTMLElement} */ (div.querySelector(".catalog-entry .progress")).textContent = "Progress: " + Math.floor(progress * 100) + "%";
        return div;
    }
}