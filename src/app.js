import { CatalogAccess } from "./catalog/catalog-access";
import { Catalog } from "./catalog/component/catalog.component";
import { Header } from "./header/header.component";
import { Menu } from "./menu/menu.component";
import { NotFoundPage } from "./not-found-page/not-found-page";
import { PlayfieldComponent } from "./playfield/playfield.component";
import { Router } from "./router";
import { StartPage } from "./start-page/component/start-page.component";
import { StartPageNonogramSelector } from "./start-page/internal/start-page-nonogram-selector";
import * as storageMigration from "./storage-migration"


/* ------------------------------ IMPLEMENTATION ------------------------------ */

const TITLE_STARTPAGE = "NonoJs · Free Nonogram Platform";
const TITLE_CATALOG = "Looking at catalog";

const contentRoot = /** @type {HTMLElement} */ (document.getElementById("content-column"));
const headerDiv = /** @type {HTMLElement} */ (document.getElementById("header-div"));
const mainDiv = /** @type {HTMLElement} */ (document.getElementById("main-div"));

const catalogAccess = new CatalogAccess();
const startPageNonogramSelector = new StartPageNonogramSelector(catalogAccess);

let notFoundPage = new NotFoundPage();
let router = new Router();
let menu = new Menu();
let header = new Header(menu);
let catalog = new Catalog(catalogAccess);
let startPage = new StartPage(startPageNonogramSelector, catalogAccess);
let playfield = /** @type {PlayfieldComponent | undefined} */ (undefined);

/* If undefined, that means the catalog is open */
let openNonogramId = /** @type {string | undefined} */ (undefined);

export async function init() {
    window.addEventListener("load", () => {
        catalogAccess.invalidateCache();
        storageMigration.performStorageMigration();
    });

    await menu.init(contentRoot);
    await header.init(headerDiv);

    header.onLogoClicked = () => navigateTo("/");

    startPage.onNonogramSelected = nonogramId => navigateTo("/n/" + nonogramId);
    startPage.onLogin = () => window.alert("Login dialog opened");
    startPage.onOpenCatalog = () => navigateTo("/catalog");

    catalog.onNonogramSelected = nonogramId => navigateTo("/n/" + nonogramId);

    router.run();
}

/**
 * 
 * @param {string} path 
 */
export function navigateTo(path) {
    window.location.replace(path);
}

export async function openStartPage() {
    /* Remove playfield if necessary */
    if (playfield) {
        playfield.destroy();
        playfield = undefined;
        openNonogramId = undefined;
    }

    /* Remove catalog if necessary */
    catalog.destroy();

    /* Open start page */
    startPage.init(mainDiv);
    document.title = TITLE_STARTPAGE;
}

export async function openCatalog() {
    /* Remove playfield if necessary */
    if (playfield) {
        playfield.destroy();
        playfield = undefined;
        openNonogramId = undefined;
    }

    /* Remove startPage if necessary */
    startPage.destroy();

    /* Attach catalog again */
    catalog.init(mainDiv);
    document.title = TITLE_CATALOG;
    openNonogramId = undefined;
}

/**
 * @param {string} nonogramId
 * @returns {Promise<Boolean>} 
 */
export async function openNonogram(nonogramId) {
    /* Nothing to do if nonogram is already open */
    if (openNonogramId == nonogramId) {
        return true;
    }

    /* Load requested nonogram */
    const nonogram = (await catalogAccess.getAllNonograms()).find(x => x.id == nonogramId);
    if (!nonogram) {
        return false;
    }

    /* Clean up other pages if necessary */
    startPage.destroy();
    catalog.destroy();

    /* Clean up current playfield if necessary */
    if (playfield) {
        playfield.view.remove();
        playfield.destroy();
    }

    /* Create new playfield */
    playfield = new PlayfieldComponent(nonogramId, nonogram.rowHints, nonogram.colHints, menu);
    playfield.init(mainDiv);
    playfield.onExit = openStartPage;
    openNonogramId = nonogramId;
    document.title = "Playing " + nonogram.colHints.length + "x" + nonogram.rowHints.length + " Nonogram"
    return true;
}

export function showNotFoundPage() {
    notFoundPage.show();
}