import { Point } from "../../common/point.js";

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

export class ZoomWindow {

    /** Zoomable content to be displayed. */
    #content;

    /** Root element of the window. */
    #view;

    /** Transformations */
    #panX = 0;
    #panY = 0;
    #scale = 1;

    /* Old touch inputs */
    #t1 = /** @type {Touch | null} */ (null);
    #t2 = /** @type {Touch | null} */ (null);

    /**
     * 
     * @param {HTMLElement} content
     * @param {HTMLElement} parent
     */
    constructor (content, parent) {
        this.#content = content;

        /* Create view */
        this.#view = document.createElement("div");
        this.#view.appendChild(content);
        parent.appendChild(this.#view);

        /* Basic setup */
        this.#view.style.position = "relative";
        this.#view.style.touchAction = "none";
        this.#view.style.overflow = "hidden";
        this.#view.style.width = "100%";
        this.#view.style.height = "100%";
        this.#view.style.padding = "10px";
        this.#view.style.boxSizing = "border-box";
        this.#content.style.transformOrigin = "top left";

        /* Center content */
        const cw = this.#content.clientWidth;
        const ch = this.#content.clientHeight;
        const vw = this.#view.clientWidth - 40;
        const vh = this.#view.clientHeight - 40;
        
        this.#scale = Math.min(1.0, vw / cw, vh / ch);
        this.#panX = (vw - cw * this.#scale) / 2;
        this.#panY = (vh - ch * this.#scale) / 2;
        this.#applyTransform();

        /* Touch handling */
        this.#view.ontouchstart = ev => {
            if (ev.touches.length > 2) {
                return;
            }

            this.#t1 = ev.touches[0] ?? null;
            this.#t2 = ev.touches[1] ?? null;
        };

        this.#view.ontouchmove = ev => {
            if (ev.touches.length > 2 || this.#t1 == null) {
                return;
            }

            /* Points for moving */
            let p1 = new Point(this.#t1.clientX, this.#t1.clientY);
            let p2 = null;
            let q1 = new Point(ev.touches[0].clientX, ev.touches[0].clientY);
            let q2 = null;

            /* Single finger move */
            if (ev.touches.length == 1) {
                p2 = new Point(p1.x + 10, p1.y + 10);
                q2 = new Point(q1.x + 10, q1.y + 10);
            } else {
                if (this.#t2 == null) {
                    return;
                }

                p2 = new Point(this.#t2.clientX, this.#t2.clientY);
                q2 = new Point(ev.touches[1].clientX, ev.touches[1].clientY);
            }

            this.#moveToFit(p1, p2, q1, q2);
            this.#applyTransform();

            this.#t1 = ev.touches[0];
            this.#t2 = ev.touches[1];
        };

        this.#view.ontouchend = ev => {
            this.#t1 = null;
            this.#t2 = null;
        }
    }

    /**
     * Adjusts pan and scale so that the location in content space at p1 will be located at q1 in view-space and vice
     * versa for p2 and q2.
     * 
     * @param {Point} p1 
     * @param {Point} p2 
     * @param {Point} q1 
     * @param {Point} q2 
     */
    #moveToFit(p1, p2, q1, q2) {
        const distOld = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const distNew = Math.hypot(q1.x - q2.x, q1.y - q2.y);

        if (distOld < 1e-5) {
            return;
        }

        const oldScale = this.#scale;
        let newScale = oldScale * (distNew / distOld);
        newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

        const cx1 = (p1.x + p2.x) / 2;
        const cy1 = (p1.y + p2.y) / 2;
        const cx2 = (q1.x + q2.x) / 2;
        const cy2 = (q1.y + q2.y) / 2; 

        let newPanX = cx2 - (cx1 - this.#panX) * newScale / oldScale;
        let newPanY = cy2 - (cy1 - this.#panY) * newScale / oldScale;

        /* Dont allow to scroll content completely out of the frame */
        const cw = this.#content.clientWidth * newScale;
        const ch = this.#content.clientHeight * newScale;

        const minPanX = Math.min(this.#view.clientWidth / 2 - cw, -cw / 2);
        const minPanY = Math.min(this.#view.clientHeight / 2 - ch, -ch / 2);
        const maxPanX = Math.max(this.#view.clientWidth - cw / 2, this.#view.clientWidth / 2);
        const maxPanY = Math.max(this.#view.clientHeight - ch / 2, this.#view.clientHeight / 2);

        newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
        newPanY = Math.max(minPanY, Math.min(maxPanY, newPanY));

        this.#panX = newPanX;
        this.#panY = newPanY;
        this.#scale = newScale;
    }

    #applyTransform() {
        this.#content.style.transform = `translate(${this.#panX}px, ${this.#panY}px) scale(${this.#scale})`
    }

    get view() {
        return this.#view;
    }

};