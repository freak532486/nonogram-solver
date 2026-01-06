import { attachCss, loadHtml } from "../../loader.js";

export class Header {

    #view = /** @type {HTMLElement | null} */ (null);

    /**
     * Creates this component and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Create view */
        attachCss(new URL("./header.css", import.meta.url));
        this.#view = await loadHtml(new URL("./header.html", import.meta.url));
        parent.appendChild(this.view);
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called.");
        }

        return this.#view;
    }

}