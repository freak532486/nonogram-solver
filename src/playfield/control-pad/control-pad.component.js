import { htmlToElement } from "../../loader.js";

import controlPad from "./control-pad.html"
import "./control-pad.css"

/** @enum {number} */
export const ControlPadButton = Object.freeze({
    LEFT: 0,
    UP: 1,
    RIGHT: 2,
    DOWN: 3,
    WHITE: 4,
    BLACK: 5,
    ERASE: 6,
    UNDO: 7,
    REDO: 8
});

export class ControlPad {
    #view = /** @type {HTMLElement | null} */ (null);

    /**
     * Creates and attaches this control pad.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await htmlToElement(controlPad);
        parent.appendChild(this.#view);

        /* Checking behaviour for black and white button */
        const btnBlack = this.getButton(ControlPadButton.BLACK);
        this.setBlackChecked(false);
        btnBlack.addEventListener("click", ev => {
            if (ev.button != 0) {
                return;
            }

            this.setBlackChecked(this.isBlackChecked() ? false : true);
        })
        
        const btnWhite = this.getButton(ControlPadButton.WHITE);
        this.setWhiteChecked(false);
        btnWhite.addEventListener("click", ev => {
            if (ev.button != 0) {
                return;
            }

            this.setWhiteChecked(this.isWhiteChecked() ? false : true);
        })
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    /**
     * Sets the callback function for a button.
     * 
     * @param {ControlPadButton} button
     * @param {() => void} fn 
     */
    setButtonFunction(button, fn) {
        this.getButton(button).onmouseup = ev => {
            if (ev.button == 0) {
                fn();
            }
        }
    }

     /**
     * Returns the element for the given button.
     * 
     * @param {ControlPadButton} button
     * @returns {HTMLInputElement}
     */
    getButton(button) {
        let buttonId = null;

        switch (button) {
            case ControlPadButton.LEFT: buttonId = "control-left"; break;
            case ControlPadButton.UP: buttonId = "control-up"; break;
            case ControlPadButton.DOWN: buttonId = "control-down"; break;
            case ControlPadButton.RIGHT: buttonId = "control-right"; break;
            case ControlPadButton.BLACK: buttonId = "control-black"; break;
            case ControlPadButton.WHITE: buttonId = "control-white"; break;
            case ControlPadButton.ERASE: buttonId = "control-erase"; break;
            case ControlPadButton.UNDO: buttonId = "control-undo"; break;
            case ControlPadButton.REDO: buttonId = "control-redo"; break;
        }

        if (!buttonId) {
            throw new Error("Unknown button: " + button);
        }

        return /** @type {HTMLInputElement} */ (this.view.querySelector("#" + buttonId));
    }

    isWhiteChecked() {
        const btnWhite = /** @type {HTMLInputElement} */ (this.view.querySelector("#control-white"));
        return btnWhite.getAttribute("data-checked") == "true";
    }

    /** @param {boolean} checked  */
    setWhiteChecked(checked) {
        const btnWhite = /** @type {HTMLInputElement} */ (this.view.querySelector("#control-white"));
        btnWhite.setAttribute("data-checked", checked ? "true" : "false");

        if (checked && this.isBlackChecked()) {
            this.setBlackChecked(false);
        }
    }

    isBlackChecked() {
        const btnBlack = /** @type {HTMLInputElement} */ (this.view.querySelector("#control-black"));
        return btnBlack.getAttribute("data-checked") == "true";
    }

    /** @param {boolean} checked  */
    setBlackChecked(checked) {
        const btnBlack = /** @type {HTMLInputElement} */ (this.view.querySelector("#control-black"));
        btnBlack.setAttribute("data-checked", checked ? "true" : "false");

        if (checked && this.isWhiteChecked()) {
            this.setWhiteChecked(false);
        }
    }
}