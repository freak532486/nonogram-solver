import { RegisterUserRequest } from "nonojs-common";
import { performRequest } from "../../api/api";

export default class AuthService {

    /**
     * Registers a new user with the given username and password.
     */
    async register(username: string, password: string): Promise<
        { status: "ok", data: undefined } | 
        { status: "user_exists", data: undefined } | 
        { status: "error", data: any }
    >
    {
        const body: RegisterUserRequest = {
            username: username,
            password: password
        };

        const request = new Request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(body)
        });

        const response = await performRequest(request);

        if (response.status == "unauthorized") {
            throw new Error("Registration does not need authorization.");
        }

        if (response.status == "error") {
            return { status: "error", data: response.data };
        }

        if (response.status == "ok") {
            return { status: "ok", data: undefined };
        }

        /* Check if the bad response is a 409 Conflict. In that case, the user already exists */
        if (response.data.status == 409) {
            return { status: "user_exists", data: undefined };
        }

        return { status: "error", data: response };
    }

}