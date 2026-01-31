/**
 * Returns 'true' iff the contents of the two arrays are equal.
 * 
 * @param {Array<*>} arr1 
 * @param {Array<*>} arr2 
 */
export function deepArraysEqual(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        const val1 = arr1[i];
        const val2 = arr2[i];

        if (Array.isArray(val1) && Array.isArray(val2)) {
            if (!deepArraysEqual(val1, val2)) {
                return false;
            }
        } else if (Object.hasOwn(val1, "equals") && !val1.equals(val2)) {
            return false;
        } else if (val1 !== val2) {
            return false;
        }
    }

    return true;
}