/**
 * @type {Map<string, HTMLElement>}
 */
const htmlCache = new Map();

/**
 * Loads a HTML file. Returns the first element inside it.
 * 
 * @param {string} html 
 * @returns {HTMLElement}
 */
export function htmlToElement(html) {
    const elem = document.createElement("div");
    elem.innerHTML = html;

    if (elem.firstElementChild == null) {
        return /** @type {HTMLElement} */ (elem.cloneNode(true));
    }

    return /** @type {HTMLElement} */ (elem.firstElementChild.cloneNode(true));
}