import { FastifyInstance } from "fastify";
import { SaveFile } from "nonojs-common";

/**
 * Returns the stored savefile for the given user, or undefined if no save file is stored for this user.
 */
export async function getSavefileForUser(fastify: FastifyInstance, userId: Number): Promise<SaveFile | undefined>
{
    // TODO: Implement
    return undefined;
}