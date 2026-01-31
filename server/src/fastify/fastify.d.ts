import "fastify";
import { Config } from "../config/impl/config-access";
import { Database } from "sqlite";
import TokenStore from "../auth/types/token-store";
import { AuthService } from "../auth/auth";

declare module "fastify" {
    interface FastifyInstance {
        state: {
            config: Config;
            db: Database;
            authService: AuthService;
        };
    }
}