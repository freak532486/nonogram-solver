import BasicAuthContent from "../types/basic-auth-content";

/**
 * Parses a basic auth header. Returns 'undefined' if the header is not a proper basic auth header.
 */
export function parseBasicAuthHeader(header: string): BasicAuthContent | undefined {
    /* Decode the base64 auth content */
    const b64 = getAuthContent(header, "Basic");
    if (!b64) {
        return undefined;
    }

    try {
        /* Try to decode base64 */
        const decoded = Buffer.from(b64, "base64").toString("utf8");
        const innerSplit = decoded.split(":");

        /* Split by colon returns username and password */
        if (innerSplit.length < 2) {
            return undefined;
        }

        /* Done parsing */
        return {
            "username": innerSplit[0],
            "password": innerSplit.slice(1).join(":")
        }

    } catch (error) {
        /* Base 64 decoding failed, so return undefined. */
        return undefined;
    }
}

/**
 * Parses a bearer authentication header and returns the given bearer token. Returns undefined if the header is
 * malformed.
 */
export function parseBearerAuthHeader(authHeader: string): string | undefined {
    return getAuthContent(authHeader, "Bearer");
}

/**
 * Returns the content of the given auth header _if_ the auth header type matches the expected type.
 */
function getAuthContent(authHeader: string, expectedAuthType: string): string | undefined {
    const split = authHeader
        .trim()
        .replace(/\s\s+/g, " ")
        .split(" ");

    /* There must be at least two segments to an auth header */
    if (split.length < 2 || split[0].toLowerCase() !== expectedAuthType.toLowerCase()) {
        return undefined;
    }

    /* Parsing done */
    return split.slice(1).join(" ");
}