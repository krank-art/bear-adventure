export const Page = Object.freeze({
  Meta: "meta",
  Tile: "tile",
  Sprite: "sprite",
});

export default class PageViewer {
  constructor({ metatilesPage, metatilesButton, tilesPage, tilesButton, spritesheetPage, spritesheetButton}) {
    this.metatilesPage = metatilesPage;
    this.metatilesButton = metatilesButton;
    this.tilesPage = tilesPage;
    this.tilesButton = tilesButton;
    this.spritesheetPage = spritesheetPage;
    this.spritesheetButton = spritesheetButton;
    this.currentPage = null;
    this.setup();
    this.setInitialPage();
  }

  setup() {
    this.metatilesButton.addEventListener("click", ((event) => {
      if (this.currentPage === Page.Meta) return;
      this.switchPage(Page.Meta);
    }).bind(this));
    this.tilesButton.addEventListener("click", ((event) => {
      if (this.currentPage === Page.Tile) return;
      this.switchPage(Page.Tile);
    }).bind(this));
    this.spritesheetButton.addEventListener("click", ((event) => {
      if (this.currentPage === Page.Sprite) return;
      this.switchPage(Page.Sprite);
    }).bind(this));
  }

  switchPage(newPage) {
    const pagesById = new Map();
    pagesById.set(Page.Meta, this.metatilesPage);
    pagesById.set(Page.Tile, this.tilesPage);
    pagesById.set(Page.Sprite, this.spritesheetPage);
    const ids = Array.from(pagesById.keys());
    if (!ids.includes(newPage)) 
      throw new Error(`Unknown page ${newPage}`);
    const pages = Array.from(pagesById.values());
    pages.forEach(page => page.classList.remove("visible"));
    pagesById.get(newPage).classList.add("visible");
    this.currentPage = newPage;

    const buttonsById = new Map();
    buttonsById.set(Page.Meta, this.metatilesButton);
    buttonsById.set(Page.Tile, this.tilesButton);
    buttonsById.set(Page.Sprite, this.spritesheetButton);
    const buttons = Array.from(buttonsById.values());
    buttons.forEach(button => button.classList.remove("active"));
    buttonsById.get(newPage).classList.add("active");
  }

  setInitialPage() {
    const pageIdsByHash = new Map();
    pageIdsByHash.set("metatiles", Page.Meta);
    pageIdsByHash.set("tiles", Page.Tile);
    pageIdsByHash.set("spritesheet", Page.Sprite);
    const hash = window.location.hash.substring(1);
    const pageId = pageIdsByHash.get(hash);
    const targetPage = pageId ?? Page.Sprite;
    this.switchPage(targetPage);
  }
}