import { attachCss, loadHtml } from "../../loader.js";

const MESSAGE_FADEOUT_SECS = 0;
const MESSAGE_VISIBLE_SECS = 5;

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
        attachCss(new URL("./message-box.css", import.meta.url));
        this.#view = await loadHtml(new URL("./message-box.html", import.meta.url));
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
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        msgDiv.setAttribute("data-ts", String(Date.now()));
        msgDiv.textContent = msg;
        this.view.prepend(msgDiv);

        /* Auto-hide message div after some time */
        const anim = (/** @type {number} */ dt) => {
            const ts = Number(msgDiv.getAttribute("data-ts"));
            const elapsed = (Date.now() - ts) / 1000;

            /* Case: Message is still fully visible */
            if (elapsed <= MESSAGE_VISIBLE_SECS) {
                requestAnimationFrame(anim);
                return;
            }

            /* Case: Message should be removed */
            if (elapsed > MESSAGE_VISIBLE_SECS + MESSAGE_FADEOUT_SECS) {
                msgDiv.remove();
                return;
            }

            /* Case: Message is fading out */
            const f = (elapsed - MESSAGE_VISIBLE_SECS) / MESSAGE_FADEOUT_SECS;
            msgDiv.style.opacity = String(1.0 - f);
            requestAnimationFrame(anim);
        };

        requestAnimationFrame(anim);
    }
};