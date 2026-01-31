import { FastifyPluginAsync } from 'fastify'
import * as auth from "../../../../auth/auth"
import { GetTokenResponse, GetTokenResponseSchema } from 'nonojs-common';

const refreshSession: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Reply: GetTokenResponse
    }>({
        method: "GET",
        url: "/refresh-session",
        schema: {
            response: {
                200: GetTokenResponseSchema
            }
        },
        handler: async function (request, reply) {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                throw fastify.httpErrors.unauthorized("Missing authorization header.");
            }

            const refreshToken = auth.parseBearerAuthHeader(authHeader);
            if (!refreshToken) {
                throw fastify.httpErrors.unauthorized("Bad bearer");
            }

            const tokens = await fastify.state.authService.refreshSession(refreshToken);
            if (!tokens) {
                throw fastify.httpErrors.unauthorized("Bad bearer");
            }

            return tokens;
        }
    });
}

export default refreshSession
