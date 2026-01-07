/**
 * Loads a HTML file. Returns the first element inside it.
 * 
 * @param {string} path 
 * @returns {Promise<HTMLElement>}
 */
export async function loadHtml(path) {
    const res = await fetch(new URL(path, import.meta.url));

    const ret = document.createElement("div");
    ret.innerHTML = await res.text();
    return /** @type {HTMLElement} */ (ret.firstChild);
}