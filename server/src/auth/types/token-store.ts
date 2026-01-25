import TwoWayMap from "../../common/types/two-way-map";
import { SESSION_TOKEN_EXPIRY_MS } from "../internal/constants";

/**
 * A token store. It can store a single session token per user id.
 */
export default class TokenStore {
    #store = new TwoWayMap<number, string>();
    #creationTimestamps = new Map<string, number>();

    /**
     * Returns the session token of the given user, or undefined if no such session exists or the session expired.
     */
    getSessionToken(userId: number): string | undefined {
        /* Fetch session token */
        const sessionToken = this.#store.getByKey(userId);
        if (!sessionToken || !this.#isTokenValid(sessionToken)) {
            return undefined;
        }

        return sessionToken;
    }

    /**
     * Returns the matching user id for the given session token, or undefined if no such user exists.
     */
    getUserId(sessionToken: string): number | undefined {
        if (this.#isTokenValid(sessionToken)) {
            return undefined;
        }

        return this.#store.getByValue(sessionToken);
    }

    /**
     * Returns true if the given token exists and has not expired yet. Cleans up expired tokens.
     */
    #isTokenValid(sessionToken: string): boolean {
        const creationTimestamp = this.#creationTimestamps.get(sessionToken);
        if (creationTimestamp && Date.now() - creationTimestamp < SESSION_TOKEN_EXPIRY_MS) {
            return true;
        }

        /* Token is expired. Remove it. */
        this.#store.deleteByValue(sessionToken);
        this.#creationTimestamps.delete(sessionToken);
        return false;
    }

    /**
     * Updates the session token of the given user.
     */
    putSessionToken(userId: number, token: string) {
        this.#store.set(userId, token);
        this.#creationTimestamps.set(token, Date.now());
    }
}