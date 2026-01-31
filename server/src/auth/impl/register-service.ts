import { createPasswordHash } from "../internal/utils";

export default class RegisterService {

    constructor(
        /**
         * Should return 'undefined' if this fails, e.g. because the user already exists. Otherwise returns the new
         * user id.
         */
        private readonly createUser: (username: string, passwordHash: string) => Promise<number | undefined>
    ) {}

    /**
     * Registers a new user. Returns the new userId if registration succeeded, and undefined otherwise.
     */
    async registerUser(username: string, password: string): Promise<number | undefined>
    {
        const passwordHash = await createPasswordHash(password);
        return this.createUser(username, passwordHash);
    }

}