import { FastifyPluginAsync } from 'fastify'
import * as auth from "../../../../auth/auth"
import { GetTokenResponse, GetTokenResponseSchema } from 'nonojs-common';

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Body: void
        Reply: GetTokenResponse
    }>({
        method: "GET",
        url: "/login",
        schema: {
            response: {
                200: GetTokenResponseSchema
            }
        },
        handler: async (request, reply) => {
            /* Parse auth header */
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                throw fastify.httpErrors.unauthorized("Missing authorization header.");
            }

            const basicAuth = auth.parseBasicAuthHeader(authHeader);
            if (!basicAuth) {
                throw fastify.httpErrors.unauthorized("Bad credentials.");
            }

            const tokens = await fastify.state.authService.login(basicAuth);
            if (!tokens) {
                throw fastify.httpErrors.unauthorized("Bad credentials");
            }

            return tokens;
        }
    });
}

export default login
