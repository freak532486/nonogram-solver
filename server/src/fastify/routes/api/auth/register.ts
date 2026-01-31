import { FastifyPluginAsync } from 'fastify'
import { RegisterUserRequest, RegisterUserRequestSchema } from 'nonojs-common';

const register: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.route<{
        Body: RegisterUserRequest
    }>({
        method: "POST",
        url: "/register",
        schema: {
            body: RegisterUserRequestSchema
        },
        handler: async function (request, reply) {
            /* Parse auth header */
            const username = request.body.username;
            const password = request.body.password;
            const userId = await fastify.state.authService.registerUser(username, password);

            if (!userId) {
                throw fastify.httpErrors.conflict("User already exists");
            }

            reply.code(201);
        }
    });
}

export default register
