import { FastifyPluginAsync } from 'fastify'
import * as auth from '../../../../auth/auth';
import { SaveFile, SaveFileSchema } from 'nonojs-common';
import savefile from '../../../../savefile/savefile';

const get: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Reply: SaveFile
    }>
    ({
        method: "GET",
        url: "/",
        schema: {
            response: {
                200: SaveFileSchema
            }
        },
        handler: async (request, response) => {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                throw fastify.httpErrors.unauthorized("Missing session token");
            }

            const sessionToken = auth.parseBearerAuthHeader(authHeader);
            if (!sessionToken) {
                throw fastify.httpErrors.unauthorized("Bad auth header");
            }

            const userId = await fastify.state.authService.getUserIdForSession(sessionToken);
            if (!userId) {
                throw fastify.httpErrors.unauthorized("Invalid session token");
            }

            return await savefile.getSavefileForUser(fastify, userId);
        }
    });
}

export default get
