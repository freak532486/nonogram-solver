import "fastify";
import { Config } from "../config/impl/config-access";
import { Database } from "sqlite";
import TokenStore from "../auth/types/token-store";

declare module "fastify" {
    interface FastifyInstance {
        state: {
            config: Config;
            db: Database;
            tokenStore: TokenStore;
        };
    }
}