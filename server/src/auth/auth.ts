import { FastifyInstance } from "fastify";
import * as headerParsing from "./impl/header-parsing";
import TokenStore from "./types/token-store";
import DatabaseAccess from "../access/database-access";
import database from "../db/database";
import AuthDto from "./impl/auth-dto";
import LoginService from "./impl/login-service";
import BasicAuthContent from "./types/basic-auth-content";
import TokenPair from "./types/token-pair";
import SessionRefreshService from "./impl/session-refresh-service";
import RegisterService from "./impl/register-service";

export class AuthService {

    #tokenStore;
    #authDto;
    #sessionRefreshService;
    #loginService;
    #registerService;

    constructor(fastify: FastifyInstance) {
        /* Create in-memory store for session tokens */
        this.#tokenStore = new TokenStore();

        /* Create database service */
        const databaseAccess: DatabaseAccess = {
            runSql: (sql, params) => database.runSql(fastify.state.db, sql, params),
            performInTransaction: (fn) => database.performInTransaction(fastify.state.db, fn)
        };

        /* Create services */
        this.#authDto = new AuthDto(databaseAccess);

        this.#sessionRefreshService = new SessionRefreshService(
            async (userId, sessionToken, creationTime) => this.#tokenStore.putSessionToken(userId, sessionToken, creationTime),
            (userId, refreshToken, creationTime) => this.#authDto.putRefreshToken(userId, refreshToken, creationTime),
            (refreshToken) => this.#authDto.getUserForRefreshToken(refreshToken)
        );

        this.#loginService = new LoginService(
            (username) => this.#authDto.getUserByUsername(username),
            (userId) => this.#sessionRefreshService.refreshTokenForUser(userId)
        );

        this.#registerService = new RegisterService(
            (username, passwordHash) => this.#authDto.createUser(username, passwordHash)
        );
    }

    /**
     * Performs a login using the given basic auth. Returns a created token pair for that user. Returns undefined if the
     * login failed (most likely due to bad credentials).
     */
    async login(basicAuth: BasicAuthContent): Promise<TokenPair | undefined> {
        return this.#loginService.performLogin(basicAuth);
    }

    /**
     * Registers a new user with the given username and password. Returns the created user id if this succeeds, or
     * undefined if it doesn't (most likely due to the user already existing).
     */
    async registerUser(username: string, password: string): Promise<number | undefined> {
        return this.#registerService.registerUser(username, password);
    }

    async refreshSession(refreshToken: string): Promise<TokenPair | undefined> {
        return this.#sessionRefreshService.refreshSession(refreshToken);
    }

    /**
     * Returns the user id for the user of the given token. Returns undefined if the session token is unknown or
     * expired.
     */
    async getUserIdForSession(sessionToken: string): Promise<number | undefined> {
        return this.#tokenStore.getUserId(sessionToken);
    }

}

export function parseBasicAuthHeader(header: string): BasicAuthContent | undefined {
    return headerParsing.parseBasicAuthHeader(header);
}

export function parseBearerAuthHeader(header: string): string | undefined {
    return headerParsing.parseBearerAuthHeader(header);
}