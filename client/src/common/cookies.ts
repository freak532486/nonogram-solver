/**
 * Reads the cookie with the given name.
 */
export function readCookie(name: string): string | undefined {
    const cookies = document.cookie.split("; ");

    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }

    return undefined;
}

/**
 * Sets the value of the cookie with the given name. 
 */
export function setCookie(name: string, value: string): void {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/`;
}

