import { SerializedNonogram } from "../common/storage-types";

class JoinedFiletype {
    /** @type {Array<SerializedNonogram>} */
    nonograms = [];
}

export class CatalogAccess {
    /** @type {Map<string, SerializedNonogram> | undefined} */
    #cache;

    async getAllNonograms() {
        if (this.#cache) {
            return Array.from(this.#cache.values());
        }

        const serialized = await fetch("/nonograms/joined.json");
        const joined = /** @type {JoinedFiletype} */ (JSON.parse(await serialized.text()));
        normalizeNonograms(joined);
        
        /* Fill cache */
        const cache = new Map();
        joined.nonograms.forEach(x => cache.set(x.id, x));
        this.#cache = cache;

        return joined.nonograms;
    }

    /**
     * Loads the nonogram with the given id. Returns undefined if no such nonogram exists.
     * 
     * @param {string} nonogramId 
     * @returns {Promise<SerializedNonogram | undefined>}
     */
    async getNonogram(nonogramId) {
        /* Fill cache if this hasn't happened yet */
        if (!this.#cache) {
            await this.getAllNonograms();
        }

        const cache = /** @type {Map<string, SerializedNonogram>} */ (this.#cache);
        return cache.get(nonogramId);
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