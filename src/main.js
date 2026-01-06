import { SerializedNonogram } from "./catalog/catalog-load.js";
import { Catalog } from "./catalog/component/catalog.component.js";
import { Header } from "./header/header.component.js";
import { Menu } from "./menu/menu.component.js";
import { PlayfieldComponent } from "./playfield/playfield.component.js";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));

/* Create menu */
const menu = new Menu();
await menu.init(contentRoot);

/* Create header */
const header = new Header(menu);
await header.init(contentRoot);
header.view.style.gridRow = "1";

/* Create area below header */
const mainDiv = document.createElement("div");
mainDiv.style.gridRow = "2";
mainDiv.style.width = "100%";
mainDiv.style.height = "100%";
mainDiv.style.overflow = "hidden";
contentRoot.appendChild(mainDiv);

/* Create catalog */
const catalog = new Catalog();
await catalog.init(mainDiv);

/** @param {SerializedNonogram} nonogram */
catalog.onNonogramSelected = async nonogram => {
    catalog.view.remove();

    const playfield = new PlayfieldComponent(nonogram.id, nonogram.rowHints, nonogram.colHints, menu);
    await playfield.init(mainDiv);
    playfield.onExit = async () => {
        playfield.view.remove();
        playfield.destroy();
        await catalog.refresh();
        mainDiv.appendChild(catalog.view);
    }
};