/**
 * @type {Map<string, HTMLElement>}
 */
const htmlCache = new Map();

/**
 * Loads a HTML file. Returns the first element inside it.
 * 
 * @param {string} path 
 * @returns {Promise<HTMLElement>}
 */
export async function loadHtml(path) {
    if (htmlCache.has(path)) {
        const cached = /** @type {HTMLElement} */ (htmlCache.get(path));
        return /** @type {HTMLElement} */ (cached.cloneNode(true));
    }

    const res = await fetch(new URL(path, import.meta.url));

    const elem = document.createElement("div");
    elem.innerHTML = await res.text();
    const ret = /** @type {HTMLElement} */ (elem.firstChild);

    htmlCache.set(path, ret);
    return /** @type {HTMLElement} */ (ret.cloneNode(true));
}