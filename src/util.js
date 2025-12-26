
/**
 * Returns 'true' iff the contents of the two arrays are equal.
 * 
 * @param {Array<*>} arr1 
 * @param {Array<*>} arr2 
 */
export function arraysEqual(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }

    return true;
}