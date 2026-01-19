import startPage from "./start-page.html"
import notdLinkTemplate from "./notd-link-template.html"
import continuePlayingTemplate from "./continue-playing-template.html"
import "./start-page.css"
import { htmlToElement } from "../../loader";
import { StartPageNonogramSelector } from "../internal/start-page-nonogram-selector";
import { CatalogAccess } from "../../catalog/catalog-access";
import { SerializedNonogram } from "../../common/storage-types";
import { NonogramPreview } from "../../nonogram-preview/nonogram-preview.component";
import { CellKnowledge, NonogramState } from "../../common/nonogram-types";
import * as storage from "../../storage"

export class StartPage {

    #nonogramSelector;
    #catalogAccess;

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
        this.#view = await htmlToElement(startPage);

        parent.appendChild(this.#view);

        /* Register listeners */
        /* Continue */
        const continueRoot = /** @type {HTMLElement} */ (this.#view.querySelector("#continue-root"));
        const lastPlayedId = await this.#nonogramSelector.getLastPlayedNonogramId();
        const lastPlayed = lastPlayedId && await this.#catalogAccess.getNonogram(lastPlayedId);
        if (lastPlayed) {
            const continueBox = await this.#createContinueButton(lastPlayed);
            continueRoot.appendChild(continueBox);

            const btnContinue = /** @type {HTMLElement} */ (continueBox.querySelector("#button-continue"));
            btnContinue.onclick = () => this.#onNonogramSelected(lastPlayedId);
        }

        /* Nonograms of the day */
        const notdContainer = /** @type {HTMLElement} */ (this.#view.querySelector(".box.notd>.box-content"));
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
        const ret = await htmlToElement(notdLinkTemplate);

        /* Fill body with a preview */
        const content = /** @type {HTMLElement} */ (ret.querySelector(".preview-container"));
        const cells = storage.retrieveStoredState(nonogram.id)?.cells;
        const nonogramState = cells ? 
            new NonogramState(nonogram.rowHints, nonogram.colHints, cells) : 
            NonogramState.empty(nonogram.rowHints, nonogram.colHints);
        const preview = new NonogramPreview(nonogramState, 120, 120);
        await preview.init(content);

        /* Set preview text */
        const previewTextSpan = /** @type {HTMLElement} */ (ret.querySelector(".preview-text"));
        
        const numFilled = nonogramState.getCellStates().filter(x => x != CellKnowledge.UNKNOWN).length;
        const numTotal = nonogramState.getCellStates().length;
        const progressText = Math.floor(100 * numFilled / numTotal) + "%";

        previewTextSpan.textContent = nonogramState.width + "x" + nonogramState.height + ", " + progressText + " finished.";

        return ret;
    }

    /**
     * Creates the "continue playing"-box.
     * 
     * @param {SerializedNonogram} nonogram
     * @returns {Promise<HTMLElement>}
     */
    async #createContinueButton(nonogram) {
        const ret = await htmlToElement(continuePlayingTemplate);

        /* Create preview */
        const content = /** @type {HTMLElement} */ (ret.querySelector(".preview-container"));
        const saveState = storage.retrieveStoredState(nonogram.id);
        const cells = saveState?.cells;
        const nonogramState = cells ? 
            new NonogramState(nonogram.rowHints, nonogram.colHints, cells) : 
            NonogramState.empty(nonogram.rowHints, nonogram.colHints);
        const preview = new NonogramPreview(nonogramState, 120, 120);
        await preview.init(content);

        /* Set preview text */
        const previewTextSpan = /** @type {HTMLElement} */ (ret.querySelector(".preview-text"));
        
        const numFilled = nonogramState.getCellStates().filter(x => x != CellKnowledge.UNKNOWN).length;
        const numTotal = nonogramState.getCellStates().length;
        const progressText = Math.floor(100 * numFilled / numTotal) + "%";

        previewTextSpan.textContent = nonogramState.width + "x" + nonogramState.height + ", " + progressText + " finished.";

        return ret;
    }

}