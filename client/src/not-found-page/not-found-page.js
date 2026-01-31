import template from "./not-found-page.html"
import "./not-found-page.css"

export class NotFoundPage {

    /**
     * Creates the not found page. This will overwrite the entire page content.
     */
    show() {
        document.body.innerHTML = template;
        document.body.classList.add("not-found-page");
        document.title = "404 Not Found";
    }

}