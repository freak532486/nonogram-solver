import fastifyStatic from "@fastify/static";
import fp from "fastify-plugin";
import * as path from "path";

export default fp(async (fastify) => {
    fastify.register(fastifyStatic, {
        root: path.resolve(__dirname, "../../../../client/dist"),
        prefix: "/"
    });

    fastify.setNotFoundHandler((req, reply) => {
        if (req.url.startsWith("/api")) {
            reply.code(404).send({ error: "Not found" })
            return
        }
        
        reply.type("text/html").sendFile("index.html")
    });
});