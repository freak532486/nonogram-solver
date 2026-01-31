/**
 * Loads a HTML file. Returns the first element inside it.
 * 
 * @param {string} html 
 * @returns {HTMLElement}
 */
export function htmlToElement(html: string): HTMLElement {
    const elem = document.createElement("div");
    elem.innerHTML = html;

    if (elem.firstElementChild == null) {
        return elem.cloneNode(true) as HTMLElement;
    }

    return elem.firstElementChild.cloneNode(true) as HTMLElement;
}