import startPage from "./start-page.html"
import notdLinkTemplate from "./notd-link-template.html"
import "./start-page.css"
import { loadHtml } from "../../loader";
import { StartPageNonogramSelector } from "../internal/start-page-nonogram-selector";
import { CatalogAccess } from "../../catalog/catalog-access";
import { SerializedNonogram } from "../../common/storage-types";

export class StartPage {

    #nonogramSelector;
    #catalogAccess;

    /** @type {HTMLElement | undefined} */
    #view;

    /** @type {HTMLElement | undefined} */
    #notdLinkTemplate;

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
     * @param {CatalogAccess} catalogAccess;
     */
    constructor (nonogramSelector, catalogAccess) {
        this.#nonogramSelector = nonogramSelector;
        this.#catalogAccess = catalogAccess;
    }


    /**
     * Creates this component and attaches it to the given parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Append to parent */
        if (!this.#view) {
            this.#view = await loadHtml(startPage);
        }

        parent.appendChild(this.#view);

        /* Register listeners */
        /* Continue */
        const btnContinue = /** @type {HTMLElement | undefined} */ (this.#view.querySelector("#button-continue"));
        const lastPlayed = await this.#nonogramSelector.getLastPlayedNonogramId();
        if (btnContinue && lastPlayed) {
            btnContinue.onclick = () => this.#onNonogramSelected(lastPlayed);
        }

        /* Nonograms of the day */
        const notdContainer = /** @type {HTMLElement} */ (this.#view.querySelector(".box.notd>.box-content"));
        notdContainer.replaceChildren();

        const notdIds = await this.#nonogramSelector.getNonogramIdsOfTheDay();
        for (const notdId of notdIds) {
            const nonogramOfTheDay = await this.#catalogAccess.getNonogram(notdId);
            if (!nonogramOfTheDay) {
                continue;
            }

            const button = await this.#createNonogramOfTheDayButton(nonogramOfTheDay);
            button.onclick = () => this.#onNonogramSelected(notdId);
            notdContainer.appendChild(button);
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

    /**
     * Creates a nonogram-of-the-day button.
     * 
     * @param {SerializedNonogram} nonogram
     * @returns {Promise<HTMLElement>}
     */
    async #createNonogramOfTheDayButton(nonogram) {
        /* Load template if this has not happened yet */
        if (!this.#notdLinkTemplate) {
            this.#notdLinkTemplate = await loadHtml(notdLinkTemplate);
        }

        /* Fill template */
        const ret = /** @type {HTMLElement} */ (this.#notdLinkTemplate.cloneNode(true));

        const header = /** @type {HTMLElement} */ (ret.querySelector(".box-header"));
        header.textContent = nonogram.colHints.length + "x" + nonogram.rowHints.length;

        return ret;
    }

}