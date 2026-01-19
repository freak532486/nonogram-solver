import * as app from "./app"

export class Router
{

    /**
     * Performs routing logic.
     * 
     */
    async run() {
        const path = window.location.pathname;
        
        if (path == "/") {
            await app.openStartPage();
            return;
        }
        
        if (path == "/catalog") {
            await app.openCatalog();
            return;
        }
        
        if (path.startsWith("/n/")) {
            const nonogramId = path.split("/")[2];
            const nonogramExists = await app.openNonogram(nonogramId);
    
            if (!nonogramExists) {
                app.showNotFoundPage();
            }
    
            return;
        }
        
        app.showNotFoundPage();
    }
}