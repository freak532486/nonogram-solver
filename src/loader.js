/**
 * Loads a HTML file. Returns the first element inside it.
 * 
 * @param {URL} url 
 * @returns {Promise<HTMLElement>}
 */
export async function loadHtml(url) {
    const res = await fetch(url);

    const ret = document.createElement("div");
    ret.innerHTML = await res.text();
    return /** @type {HTMLElement} */ (ret.firstChild);
}

/**
 * Attaches a CSS file to the document.
 * 
 * @param {URL} url 
 */
export function attachCss(url) {
    if (document.querySelector(`link[href="${url}"]`)) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url.href;
    document.head.appendChild(link);
}

/**
 * Detaches the given CSS file from the document.
 * @param {URL} url 
 */
export function detachCss(url) {
    const link = document.querySelector(`link[href="${url.href}"]`);
    link?.remove();
}