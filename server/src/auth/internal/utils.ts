import * as bcrypt from "bcrypt"
import * as crypto from "crypto"

const BCRYPT_NUM_HASH_ROUNDS = 10;
const TOKEN_LENGTH = 32;


/**
 * Generates a random session- or refresh-token.
 */
export function generateRandomToken() {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}


/**
 * Creates a password hash. The hash is salted using the username.
 */
export async function createPasswordHash(password: string): Promise<string>
{
    return await bcrypt.hash(password, BCRYPT_NUM_HASH_ROUNDS);
}


/**
 * Compares if the stored hash matches the given password.
 */
export async function validatePassword(password: string, storedHash: string) {
    return await bcrypt.compare(password, storedHash);
}