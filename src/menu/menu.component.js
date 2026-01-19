import { htmlToElement } from "../loader.js";

import menu from "./menu.html"
import "./menu.css"

export class Menu {
    
    #view = /** @type {HTMLElement | null} */ (null);
    /**
     * Initializes and attaches this component.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await htmlToElement(menu);
        parent.appendChild(this.#view);

        /* Hide by default */
        this.view.style.visibility = "hidden";

        /* Hide when tapping outside of menu area */
        const entriesElem = /** @type {HTMLElement} */ (this.view.querySelector(".entries"));
        this.view.onclick = ev => {
            if (!entriesElem.contains(/** @type {Node} */ (ev.target))) {
                this.view.style.visibility = "hidden";
            }
        }
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    /** Shows or hides the menu */
    toggle() {
        if (this.view.style.visibility == "visible") {
            this.view.style.visibility = "hidden";
        } else {
            this.view.style.visibility = "visible";
        }
    }

    /**
     * Appends an entry to the menu.
     * 
     * @param {HTMLElement} element 
     */
    appendElement(element) {
        const entriesElem = /** @type {HTMLElement} */ (this.view.querySelector(".entries"));
        entriesElem.append(element);
    }

    /**
     * Removes an entry, based on its class name.
     * 
     * @param {String} elementClass 
     */
    removeElement(elementClass) {
        const entriesElem = /** @type {HTMLElement} */ (this.view.querySelector(".entries"));
        entriesElem.querySelectorAll("." + elementClass).forEach(x => x.remove());
    }

}