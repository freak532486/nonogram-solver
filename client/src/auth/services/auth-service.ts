import { RegisterUserRequest } from "nonojs-common";
import { performRequest } from "../../api/api";

export default class AuthService {

    constructor (
        private readonly onLoginRequired: () => Promise<void>,
        private readonly onUnexpectedResponse: (response: Response) => Promise<void>,
        private readonly onError: (error: any) => Promise<void>
    ) {}

    /**
     * Registers a new user with the given username and password.
     */
    async register(username: string, password: string): Promise<"ok" | "user_exists" | "error">
    {
        const body: RegisterUserRequest = {
            username: username,
            password: password
        };

        const request = new Request("/auth/register", {
            method: "PUT",
            body: JSON.stringify(body)
        });

        const response = await performRequest(request);

        if (response.status == "unauthorized") {
            throw new Error("Registration does not need authorization.");
        }

        if (response.status == "error") {
            await this.onError(response.data);
            return "error";
        }

        if (response.status == "ok") {
            return "ok";
        }

        /* Check if the bad response is a 409 Conflict. In that case, the user already exists */
        if (response.data.status == 409) {
            return "user_exists";
        }

        await this.onUnexpectedResponse(response.data);
        return "error";
    }

}