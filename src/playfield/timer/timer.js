import timer from "./timer.html"
import "./timer.css"
import { loadHtml } from "../../loader.js";

export class Timer {

    #view = /** @type {HTMLElement | null} */ (null);

    #startTimestamp;
    #curElapsed;

    /**
     * Creates a new timer component. Can be started with some already-elapsed time if desired.
     * 
     * @param {number} elapsedSeconds 
     */
    constructor(elapsedSeconds = 0) {
        this.#startTimestamp = Date.now() - elapsedSeconds * 1000;
        this.#curElapsed = elapsedSeconds;

        /* Start animation for timer */
        const anim = () => {
            const elapsed = Math.floor((Date.now() - this.#startTimestamp) / 1000);
            if (elapsed == this.#curElapsed) {
                requestAnimationFrame(anim);
                return;
            }

            this.#curElapsed = elapsed;
            this.#updateDisplayedTime();
            requestAnimationFrame(anim);
        };

        requestAnimationFrame(anim);
    }

    /**
     * Initialized and attaches this component
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await loadHtml(timer);
        parent.appendChild(this.view);

        this.#updateDisplayedTime();
    }

    /** @returns {HTMLElement} */
    get view() {
        if (!this.#view) {
            throw new Error("init() has not been called");
        }

        return this.#view;
    }

    #updateDisplayedTime() {
        const timeSpan = /** @type {HTMLElement} */ (this.view.querySelector(".time"));
        timeSpan.textContent = getTimeString(this.#curElapsed);
    }

}

/**
 * @param {number} elapsedSeconds 
 * @returns {string}
 */
function getTimeString(elapsedSeconds) {
    const seconds = Math.floor(elapsedSeconds % 60);
    const minutes = Math.floor(((elapsedSeconds - seconds) / 60)) % 60;
    const hours = Math.floor((elapsedSeconds - seconds - 60 * minutes) / (60 * 60));

    if (hours == 0) {
        return withLeadingZero(minutes) + ":" + withLeadingZero(seconds);
    } else {
        return withLeadingZero(hours) + ":" + withLeadingZero(minutes) + ":" + withLeadingZero(seconds);
    }
}

/**
 * @param {number} n 
 * @returns {string}
 */
function withLeadingZero(n) {
    return n < 10 ? "0" + n : String(n);
}