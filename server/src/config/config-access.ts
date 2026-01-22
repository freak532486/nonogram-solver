import * as fs from "fs"
import * as path from "path"

export class ConfigAccess {

    #config: Record<string, unknown> | undefined;

    init() {
        const settingsPath = path.join(process.cwd(), "nonojs-server-settings.json");

        try {    
            const data = fs.readFileSync(settingsPath, "utf-8");
            this.#config = JSON.parse(data);
        } catch (error) {
            throw new Error("Failed reading settings from '" + settingsPath  + "'.");
        } 
    }

    /**
     * Returns the value of a given server setting. Returns 'undefined' if no such setting exists or is not a string.
     */
    getStringSetting(key: string): string | undefined {
        if (!this.#config) {
            throw new Error("");
        }

        const maybeValue = this.#config[key];
        if (typeof maybeValue === "string") {
            return maybeValue;
        }

        return undefined;
    }

    /**
     * Returns the value of a given server setting. Returns 'undefined' if no such setting exists or is not a number.
     */
    getNumberSetting(key: string): number | undefined {
        if (!this.#config) {
            throw new Error("");
        }

        const maybeValue = this.#config[key];
        if (typeof maybeValue === "number") {
            return maybeValue;
        }

        return undefined;
    }

}