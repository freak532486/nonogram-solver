import { loadNonograms } from "./catalog/catalog-load";
import { Catalog } from "./catalog/component/catalog.component";
import { Header } from "./header/header.component";
import { Menu } from "./menu/menu.component";
import { PlayfieldComponent } from "./playfield/playfield.component";

/**
 * Initializes the application.
 */
export async function init() {
    await _init();
}

/**
 * Opens the catalog. Does nothing if the catalog is already open.
 */
export async function openCatalog() {
    await _openCatalog();
}

/**
 * Opens the playfield for the given nonogram. Returns false if no such nonogram exists.
 * 
 * @param {string} nonogramId
 * @returns {Promise<Boolean>}
 */
export async function openNonogram(nonogramId) {
    return _openNonogram(nonogramId);
}






/* ------------------------------ IMPLEMENTATION ------------------------------ */

const TITLE_CATALOG = "NonoJs · Free Nonogram Platform";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));
const headerDiv = /** @type {HTMLElement} */ (document.getElementById("header-div"));
const mainDiv = /** @type {HTMLElement} */ (document.getElementById("main-div"));

let menu = new Menu();
let catalog = new Catalog();
let playfield = /** @type {PlayfieldComponent | undefined} */ (undefined);

/* If undefined, that means the catalog is open */
let openNonogramId = /** @type {string | undefined} */ (undefined);

async function _init() {
    await menu.init(contentRoot);
    await new Header(menu).init(headerDiv);
    await catalog.init(mainDiv);

    catalog.onNonogramSelected = openNonogram;

    _openCatalog();
}

async function _openCatalog() {
    if (!openNonogramId) {
        return;
    }

    /* Remove playfield if necessary */
    if (playfield) {
        playfield.view.remove();
        playfield.destroy();
    }

    /* Attach catalog again */
    catalog.init(contentRoot);
    document.title = TITLE_CATALOG;
    openNonogramId = undefined;
}

/**
 * @param {string} nonogramId
 * @returns {Promise<Boolean>} 
 */
async function _openNonogram(nonogramId) {
    /* Nothing to do if nonogram is already open */
    if (openNonogramId == nonogramId) {
        return true;
    }

    /* Load requested nonogram */
    const nonogram = (await loadNonograms()).find(x => x.id == nonogramId);
    if (!nonogram) {
        return false;
    }

    /* Clean up catalog if necessary */
    catalog.view.remove();

    /* Clean up current playfield if necessary */
    if (playfield) {
        playfield.view.remove();
        playfield.destroy();
    }

    /* Create new playfield */
    playfield = new PlayfieldComponent(nonogramId, nonogram.rowHints, nonogram.colHints, menu);
    playfield.init(mainDiv);
    playfield.onExit = openCatalog;
    openNonogramId = nonogramId;
    document.title = "Playing " + nonogram.colHints.length + "x" + nonogram.rowHints.length + " Nonogram"
    return true;
}
