import { SerializedNonogram } from "../common/storage-types";

class JoinedFiletype {
    /** @type {Array<SerializedNonogram>} */
    nonograms = [];
}

export class CatalogAccess {
    /** @type {JoinedFiletype | undefined} */
    #cache;

    async getAllNonograms() {
        if (this.#cache) {
            return this.#cache.nonograms;
        }

        const serialized = await fetch("/nonograms/joined.json");
        const joined = /** @type {JoinedFiletype} */ (JSON.parse(await serialized.text()));
        normalizeNonograms(joined);
        this.#cache = joined;
        return joined.nonograms;
    }

    invalidateCache() {
        this.#cache = undefined;
    }
}

/**
 * Removes all hints smaller than or equal to zero from the hint lists.
 * 
 * @param {JoinedFiletype} joined 
 */
function normalizeNonograms(joined) {
    for (const nonogram of joined.nonograms) {
        for (let i = 0; i < nonogram.colHints.length; i++) {
            nonogram.colHints[i] = nonogram.colHints[i].filter(hint => hint > 0);
        }

        for (let i = 0; i < nonogram.rowHints.length; i++) {
            nonogram.rowHints[i] = nonogram.rowHints[i].filter(hint => hint > 0);
        }
    }
}