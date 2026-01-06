import { attachCss, loadHtml } from "../../loader.js";

/** @enum {number} */
export const MenuButton = Object.freeze({
    HINT: 0,
    SOLVE_LINE: 1,
    SOLVE: 2,
    RESET: 3,
    EXIT: 4
});

export class PlayfieldMenu {
    /** @type {HTMLElement | null} */
    #view = null;

    /**
     * Initializes this component and attaches it to the parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        attachCss(new URL("./playfield-menu.css", import.meta.url));
        this.#view = await loadHtml(new URL("./playfield-menu.html", import.meta.url));
        this.hide();
        parent.appendChild(this.#view);
    }

    get view() {
        if (this.#view == null) {
            throw new Error("Menu was not initialized!");
        }

        return this.#view;
    }

    hide() {
        if (this.#view !== null) {
            this.#view.style.visibility = "hidden";
        }
    }

    show() {
        if (this.#view !== null) {
            this.#view.style.visibility = "visible";
        }
    }

    /**
     * Returns true if the menu is hidden.
     * 
     * @returns {boolean}
     */
    isHidden() {
        if (this.#view !== null) {
            return this.#view.style.visibility == "hidden";
        }

        throw new Error("init() was not called.");
    }

    /**
     * Sets the onclick event listener of a menu button.
     * 
     * @param {MenuButton} button 
     * @param {() => void} fn 
     */
    setButtonFunction(button, fn) {
        if (!this.#view) {
            throw new Error("init() was not called");
        }

        let buttonId = null;
        switch (button) {
            case MenuButton.HINT: buttonId = "button-hint"; break;
            case MenuButton.SOLVE_LINE: buttonId = "button-next"; break;
            case MenuButton.SOLVE: buttonId = "button-solve"; break;
            case MenuButton.RESET: buttonId = "button-reset"; break;
            case MenuButton.EXIT: buttonId = "button-exit"; break;
        }

        if (!buttonId) {
            throw new Error("Unknown button: " + button);
        }

        const buttonElement = /** @type {HTMLElement} */ (this.#view.querySelector("#" + buttonId));
        buttonElement.onclick = fn;
    }
};