import { ConfigAccess } from "./config/config-access";
import { DatabaseAccess } from "./database/database-access";

/* Services are kept in global variable for easy access from every file. */
let gServices: Services | undefined;

export class Services {
    #configAccess;
    #databaseAccess;

    constructor (configAccess: ConfigAccess, databaseAccess: DatabaseAccess) {
        this.#configAccess = configAccess;
        this.#databaseAccess = databaseAccess;
    }

    get configAccess() {
        return this.#configAccess;
    }

    get databaseAccess() {
        return this.#databaseAccess;
    }
}

/**
 * Initialized all services. Is called exactly once on server startup.
 */
export async function init() {
    if (gServices) {
        throw new Error("Service initialization was called twice");
    }

    const configAccess = new ConfigAccess();
    await configAccess.init();

    const databaseAccess = new DatabaseAccess(configAccess);
    await databaseAccess.init();

    gServices = new Services(configAccess, databaseAccess);
}

/**
 * Returns an object containing all available application-scoped services.
 */
export function getServices() {
    if (!gServices) {
        throw new Error("Services have not been initialized.");
    }

    return gServices;
}