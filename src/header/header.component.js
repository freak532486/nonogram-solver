import { htmlToElement } from "../loader.js";
import { Menu } from "../menu/menu.component.js";

import header from "./header.html"
import "./header.css"

export class Header {

    #view = /** @type {HTMLElement | null} */ (null);

    /** @type {Menu} */
    #menu;

    /** @type {() => void} */
    #onLogoClicked = () => {};

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
        this.#view = await htmlToElement(header);
        parent.appendChild(this.view);

        /* Logo click */
        const imgLogo = /** @type {HTMLElement} */ (this.#view.querySelector("#logo"));
        imgLogo.onclick = () => this.#onLogoClicked();

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

    /**
     * Sets the callback for when the logo image is clicked.
     * 
     * @param {() => void} fn 
     */
    set onLogoClicked(fn) {
        this.#onLogoClicked = fn;
    }

}