import startPage from "./start-page.html"
import "./start-page.css"
import { loadHtml } from "../../loader";
import { StartPageNonogramSelector } from "../internal/start-page-nonogram-selector";

export class StartPage {

    #nonogramSelector;

    /** @type {HTMLElement | undefined} */
    #view;

    /* Listeners */

    /** @type {(nonogramId: string) => void} */
    #onNonogramSelected = () => {};

    /** @type {() => void} */
    #onOpenCatalog = () => {};

    /** @type {() => void} */
    #onOpenSettings = () => {};

    /** @type {() => void} */
    #onLogin = () => {};


    /**
     * Creates a new start page object.
     * 
     * @param {StartPageNonogramSelector} nonogramSelector 
     */
    constructor (nonogramSelector) {
        this.#nonogramSelector = nonogramSelector;
    }


    /**
     * Creates this component and attaches it to the given parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Append to parent */
        this.#view = await loadHtml(startPage);
        parent.appendChild(this.#view);

        /* Register listeners */
        /* Continue */
        const btnContinue = /** @type {HTMLElement | undefined} */ (this.#view.querySelector("#button-continue"));
        const lastPlayed = await this.#nonogramSelector.getLastPlayedNonogramId();
        if (btnContinue && lastPlayed) {
            btnContinue.onclick = () => this.#onNonogramSelected(lastPlayed);
        }

        /* Nonograms of the day */
        const btnsNotd = /** @type {NodeListOf<HTMLElement>} */ (this.#view.querySelectorAll(".button-notd"));
        const notdArr = await this.#nonogramSelector.getNonogramIdsOfTheDay();
        if (btnsNotd.length != notdArr.length) {
            throw new Error("More/Less buttons for nonogram-of-the-day than there are nonograms-of-the-day");
        }

        for (let i = 0; i < btnsNotd.length; i++) {
            btnsNotd[i].onclick = () => this.#onNonogramSelected(notdArr[i]);
        }

        /* Random nonogram */
        const btnRandom = /** @type {HTMLElement} */ (this.#view.querySelector("#button-random"));
        btnRandom.onclick = async () => {
            const nonogramId = await this.#nonogramSelector.getRandomNonogramId();
            this.#onNonogramSelected(nonogramId);
        }

        /* Catalog */
        const btnCatalog = /** @type {HTMLElement} */ (this.#view.querySelector("#button-catalog"));
        btnCatalog.onclick = () => this.#onOpenCatalog();

        /* Settings */
        const btnSettings = /** @type {HTMLElement} */ (this.#view.querySelector("#button-settings"));
        btnSettings.onclick = () => this.#onOpenSettings();

        /* Login */
        const btnLogin = /** @type {HTMLElement} */ (this.#view.querySelector("#button-login"));
        btnLogin.onclick = () => this.#onLogin();
    }

    destroy() {
        if (this.#view) {
            this.#view.remove();
        }
    }

    /**
     * Sets the callback for when a nonogram gets selected on the start page.
     * 
     * @param {(nonogramId: string) => void} fn 
     */
    set onNonogramSelected(fn) {
        this.#onNonogramSelected = fn;
    }

    /**
     * Sets the callback for when the catalog should be opened.
     * 
     * @param {() => void} fn 
     */
    set onOpenCatalog(fn) {
        this.#onOpenCatalog = fn;
    }

    /**
     * Sets the callback for when the settings should be opened.
     * 
     * @param {() => void} fn 
     */
    set onOpenSettings(fn) {
        this.#onOpenSettings = fn;
    }

    /**
     * Sets the callback for when the login dialog should be opened.
     * 
     * @param {() => void} fn 
     */
    set onLogin(fn) {
        this.#onLogin = fn;
    }

}