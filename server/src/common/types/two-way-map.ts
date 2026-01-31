/**
 * A two way map that supports fetching a value for a key _and_ a key for a value in O(1).
 */
export default class TwoWayMap<K, V> {

    #keyToValue: Map<K, V> = new Map();
    #valueToKey: Map<V, K> = new Map();

    /**
     * Puts an entry into the map. Overwrites old entries if necessary.
     */
    set(key: K, value: V) {
        this.deleteByKey(key);
        this.deleteByValue(value);
        this.#keyToValue.set(key, value);
        this.#valueToKey.set(value, key);
        return this;
    }

    /**
     * Retrieves a value by given key.
     */
    getByKey(key: K) {
        return this.#keyToValue.get(key);
    }

    /**
     * Retrieves a key by given value.
     */
    getByValue(value: V) {
        return this.#valueToKey.get(value);
    }

    /**
     * Deletes the entry with the given key.
     */
    deleteByKey(key: K) {
        if (!this.#keyToValue.has(key)) {
            return false;
        }

        const value = this.#keyToValue.get(key);
        this.#keyToValue.delete(key);
        this.#valueToKey.delete(value!);
        return true;
    }

    /**
     * Deletes the entry with the given value.
     */
    deleteByValue(value: V) {
        if (!this.#valueToKey.has(value)) {
            return false;
        }

        const key = this.#valueToKey.get(value);
        this.#keyToValue.delete(key!);
        this.#valueToKey.delete(value);
        return true;
    }

    /**
     * Clears the map.
     */
    clear() {
        this.#keyToValue.clear();
        this.#valueToKey.clear();
    }

    /**
     * Returns the number of stored entries in this map.
     */
    get size() {
        return this.#keyToValue.size;
    }

};