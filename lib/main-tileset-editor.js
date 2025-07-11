import PageViewer from "./page-viewer";
import SpritesheetEditor from "./spritesheet-editor";
import TilesetManager from "./tileset-manager";

async function executeWhenImageIsLoaded(img, action, retryTime = 200) {
  const interval = setInterval(async () => {
    if (img.complete && img.naturalWidth !== 0) {
      clearInterval(interval);
      await action();
    }
  }, retryTime);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

(async function setupTilesetEditor() {

  const then = Date.now();

  const pageViewer = new PageViewer({
    metatilesPage: document.getElementById("meta-tile-editor"),
    metatilesButton: document.getElementById("meta-tile-button"),
    tilesPage: document.getElementById("single-tile-editor"),
    tilesButton: document.getElementById("single-tile-button"),
    spritesheetPage: document.getElementById("spritesheet-editor"),
    spritesheetButton: document.getElementById("spritesheet-button"),
  });

  const spritesheet = await loadImage("/assets/spritesheet.png");
  const spritesheetViewer = document.querySelector(".spritesheet");
  spritesheetViewer.style.display = "block";
  const spritesheetEditor = new SpritesheetEditor({
    spritesheet: spritesheet,
    image: spritesheetViewer,
    grid: document.querySelector(".spritesheet-grid"),
  });

  const zoomLabel = document.getElementById("zoom-label");
  spritesheetEditor.onScaled = (scale) => zoomLabel.textContent = `${scale * 100} %`;
  spritesheetEditor.resize(4);
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  zoomInButton.addEventListener("click", () => spritesheetEditor.zoomIn());
  zoomOutButton.addEventListener("click", () => spritesheetEditor.zoomOut());

  spritesheetEditor.onSelect = (selection) => console.log(selection);

  const tileList = document.getElementById("tile-list");
  console.log(Date.now() - then);
  const manager = new TilesetManager(spritesheet, tileList);
  console.log(Date.now() - then);
  await manager.appendEntriesInBatches(50, 1000);
  console.log(Date.now() - then);
  console.log(manager.tiles.length);
})();
