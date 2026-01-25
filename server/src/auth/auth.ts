import { parseBasicAuthHeader, parseBearerAuthHeader } from "./impl/common";
import performLogin from "./impl/login";
import { checkIfUserExists, registerUser } from "./impl/register";
import { getUserIdForSession, refreshSession, refreshTokenForUser } from "./impl/token-refresh";

const auth = {
    parseBasicAuthHeader,
    parseBearerAuthHeader,

    performLogin,
    registerUser,
    checkIfUserExists,

    refreshTokenForUser,
    refreshSession,
    getUserIdForSession
}

export default auth;