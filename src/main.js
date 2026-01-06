import { SerializedNonogram } from "./catalog/catalog-load.js";
import { Catalog } from "./catalog/component/catalog.component.js";
import { Header } from "./common/header/header.component.js";
import { PlayfieldComponent } from "./playfield/playfield.component.js";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));

/* Create header */
const header = new Header();
await header.init(contentRoot);
header.view.style.gridRow = "1";

/* Create area below header */
const mainDiv = document.createElement("div");
mainDiv.style.gridRow = "2";
mainDiv.style.height = "100%";
contentRoot.appendChild(mainDiv);

/* Create catalog */
const catalog = new Catalog();
await catalog.init(mainDiv);

/** @param {SerializedNonogram} nonogram */
catalog.onNonogramSelected = async nonogram => {
    catalog.view.remove();

    const playfield = new PlayfieldComponent(nonogram.rowHints, nonogram.colHints);
    await playfield.init(mainDiv);
    playfield.onExit = () => {
        playfield.view.remove();
        mainDiv.appendChild(catalog.view);
    }
};