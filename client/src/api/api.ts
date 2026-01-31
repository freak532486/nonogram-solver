import { GetTokenResponse } from "nonojs-common";

export interface RequestResultOk { status: "ok", data: Response };
export interface RequestResultUnauthorized { status: "unauthorized", data: undefined };
export interface RequestResultBadResponse { status: "bad_response", data: Response };
export interface RequestResultError { status: "error", data: any };

export type RequestResult = 
    RequestResultOk | 
    RequestResultUnauthorized |
    RequestResultBadResponse |
    RequestResultError;

/**
 * Performs the given request. No authorization is appended. All error cases must be handled explicitly.
 */
export async function performRequest(request: Request): Promise<RequestResult>
{
    try {
        /* Every request will be a json request */
        request.headers.set("Content-Type", "application/json");

        const response = await fetch(request);

        if (response.status == 401) {
            return { status: "unauthorized", data: undefined };
        }

        if (!response.ok) {
            return { status: "bad_response", data: response };
        }

        return { status: "ok", data: response };

    } catch (err) {
        return { status: "error", data: err };
    }
}

export async function performRequestWithSessionToken(request: Request): Promise<RequestResult>
{
    /* Unauthorized if there is no refresh token, since then there is no session */
    const sessionToken = getSessionToken();
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return { status: "unauthorized", data: undefined };
    }

    /* If there is a session token, perform first attempt with existing session token */
    if (sessionToken) {
        /* Augment request with session token */
        request.headers.set("Authorization", "Bearer " + sessionToken);

        /* Perform request */
        const firstResponse = await performRequest(request);

        /* Anything except unauthorized does not need special handling */
        if (firstResponse.status !== "unauthorized") {
            return firstResponse;
        }
    }

    /* Refresh session tokens */
    const refreshResponse = await refreshTokens(refreshToken);
    if (refreshResponse.status == "bad_response" || refreshResponse.status == "error") {
        return {
            status: "error",
            data: new Error("Failed to refresh tokens", { cause: refreshResponse.data })
        };
    }

    /* If refresh fails due to authorization, then the refresh token expired. */
    if (refreshResponse.status == "unauthorized") {
        return { status: "unauthorized", data: undefined };
    }

    /* Use new session token now */
    const newSessionToken = getSessionToken();
    if (!newSessionToken) {
        return { status: "error", data: new Error("Session token was undefined after token refresh.") };
    }

    request.headers.set("Authorization", "Bearer " + newSessionToken);

    /* Second request attempt. No retry logic, so this will be the final result */
    return performRequest(request);
}

/**
 * Refreshes session- and refresh token. Returns the result of the refresh-call to check for failures.
 */
async function refreshTokens(refreshToken: string): Promise<RequestResult>
{
    try {
        const response = await performRequest(new Request("/auth/refresh-tokens", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + refreshToken
            }
        }));

        if (response.status !== "ok") {
            return response;
        }

        const body = (await response.data.json()) as GetTokenResponse;
        setSessionToken(body.sessionToken);
        setRefreshToken(body.refreshToken);
        return response;
    } catch (err) {
        return { status: "error", data: err };
    }
}

function getSessionToken(): string | undefined {
    return readCookie("sessionToken");
}

function setSessionToken(token: string) {
    writeCookie("sessionToken", token, 60 * 60); // 1 hour expiry.
}

function getRefreshToken(): string | undefined {
    return readCookie("refreshToken");
}

function setRefreshToken(token: string) {
    writeCookie("refreshToken", token, 7 * 24 * 60 * 60); // 7 days expiry.
}

function readCookie(key: string): string | undefined {
    const encodedKey = encodeURIComponent(key) + "=";
    const parts = document.cookie.split("; ");

    for (const part of parts) {
        if (part.startsWith(encodedKey)) {
            return decodeURIComponent(part.substring(encodedKey.length));
        }
    }

    return undefined;
}

function writeCookie(key: string, value: string, maxAgeSeconds: number): void {
    const params = "Path=/; SameSite=Strict; Max-Age=" + maxAgeSeconds;
    document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; " + params;
}