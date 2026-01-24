import { parseBasicAuthHeader, parseBearerAuthHeader } from "./impl/common";
import performLogin from "./impl/login";
import { checkIfUserExists, registerUser } from "./impl/register";
import { refreshSession, refreshTokenForUser } from "./impl/token-refresh";

const auth = {
    parseBasicAuthHeader,
    parseBearerAuthHeader,

    performLogin,
    registerUser,
    checkIfUserExists,
    refreshTokenForUser,
    refreshSession
}

export default auth;