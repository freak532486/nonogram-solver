import { loadHtml } from "../loader.js";
import { Menu } from "../menu/menu.component.js";

import header from "./header.html"
import "./header.css"

export class Header {

    #view = /** @type {HTMLElement | null} */ (null);

    /** @type {Menu} */
    #menu;

    /**
     * @param {Menu} menu 
     */
    constructor (menu) {
        this.#menu = menu;
    }

    /**
     * Creates this component and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Create view */
        this.#view = await loadHtml(header);
        parent.appendChild(this.view);

        /* Menu toggle */
        const btnMenu = /** @type {HTMLElement} */ (this.view.querySelector(".button.menu"));
        btnMenu.onclick = () => {
            this.#menu.toggle();
        }
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called.");
        }

        return this.#view;
    }

}