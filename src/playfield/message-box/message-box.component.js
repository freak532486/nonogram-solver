import { htmlToElement } from "../../loader.js";

import messageBox from "./message-box.html"
import "./message-box.css"

const MESSAGE_VISIBLE_SECS = 15;
const MAX_MESSAGES = 5;

export class MessageBox {
    /** @type {HTMLElement | null} */
    #view = null;

    /**
     * Initializes and attaches this component.
     * 
     * @param {HTMLElement} parent 
     */
    async init(parent) {
        /* Create view */
        this.#view = await htmlToElement(messageBox);
        parent.appendChild(this.#view);
    }

    get view() {
        if (!this.#view) {
            throw new Error("init() was not called");
        }

        return this.#view;
    }

    /**
     * Displays a message.
     * 
     * @param {String} msg 
     */
    showMessage(msg) {
        /* Remove oldest message if too many messages */
        const allMsgs = this.view.querySelectorAll(".message");
        if (allMsgs.length >= MAX_MESSAGES) {
            allMsgs[0].remove();
        }

        /* Create div for message */
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        msgDiv.setAttribute("data-ts", String(Date.now()));
        msgDiv.appendChild(document.createTextNode(msg));
        this.view.append(msgDiv);

        /* Remove on click */
        msgDiv.onclick = () => msgDiv.remove();

        /* Add hide progress bar */
        const progressDiv = document.createElement("div");
        progressDiv.style.position = "absolute";
        progressDiv.style.left = "10px";
        progressDiv.style.bottom = "3px";
        progressDiv.style.right = "10px";
        progressDiv.style.height = "2px";
        progressDiv.style.backgroundColor = "var(--fg1)";
        progressDiv.style.transformOrigin = "center left";
        msgDiv.appendChild(progressDiv);

        /* Auto-hide message div after some time */
        const anim = () => {
            const ts = Number(msgDiv.getAttribute("data-ts"));
            const elapsed = (Date.now() - ts) / 1000;

            /* Case: Message is still fully visible */
            if (elapsed <= MESSAGE_VISIBLE_SECS) {
                const f = elapsed / MESSAGE_VISIBLE_SECS;
                progressDiv.style.transform = "scale(" + (1 - f) + ", 1)";
                requestAnimationFrame(anim);
                return;
            }

            /* Case: Message should be removed */
            msgDiv.remove();
        };

        requestAnimationFrame(anim);
    }
};