import startPage from "./start-page.html"
import "./start-page.css"
import { loadHtml } from "../loader";

export class StartPage {

    /** @type {HTMLElement | undefined} */
    #view;


    /**
     * Creates this component and attaches it to the given parent.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        this.#view = await loadHtml(startPage);
        parent.appendChild(this.#view);
    }

}