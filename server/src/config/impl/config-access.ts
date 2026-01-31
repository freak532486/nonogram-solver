import * as fs from "fs"
import Config from "../types/config";

/**
 * Reads a configuration from a given file. Returns undefined if no config exists at the given location.
 */
export function readConfig(path: string): Config | undefined {
    if (!fs.existsSync(path)) {
        return undefined;
    }

    try {
        const data = fs.readFileSync(path, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        throw new Error("Failed reading settings from '" + path  + "'.");
    }
}

/**
 * Returns the value of the key in the given config. Returns 'undefined' if no such setting exists or is not a string.
 */
export function getStringSetting(config: Config, key: string): string | undefined
{
    const maybeValue = config[key];
    if (typeof maybeValue === "string") {
        return maybeValue;
    }

    return undefined;
}

/**
 * Returns the value of the key in the given config. Returns 'undefined' if no such setting exists or is not a string.
 */
export function getNumberSetting(config: Config, key: string): number | undefined
{
    const maybeValue = config[key];
    if (typeof maybeValue === "number") {
        return maybeValue;
    }

    return undefined;
}