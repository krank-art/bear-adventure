import PageViewer from "./page-viewer";
import PropertyList from "./property-list";
import SpritesheetEditor, { SpritesheetZoomer } from "./spritesheet-editor";
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

function setupDialog({ dialogId, buttonId, onSubmit }) {
  const dialog = document.getElementById(dialogId);
  const input = dialog.querySelector("input");
  const openButton = document.getElementById(buttonId);
  openButton.addEventListener("click", () => {
    dialog.showModal();
    if (input) input.focus();
  });
  const closeButton = dialog.querySelector("button[data-dialog-action=close]");
  closeButton.addEventListener("click", () => {
    dialog.close();
    // 2025 July 11 -- for some reason, the native 'command="close"' attribute doesn't work.
  });
  const form = dialog.querySelector("form");
  form.addEventListener("submit", onSubmit);
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
  const spritesheetEditor = new SpritesheetEditor({
    spritesheet: spritesheet,
    image: document.querySelector(".spritesheet"),
    grid: document.querySelector(".spritesheet-grid"),
  });
  const zoomer = new SpritesheetZoomer({
    spritesheetEditor: spritesheetEditor,
    zoomLabel: document.getElementById("zoom-label"),
    zoomInButton: document.getElementById("zoom-in"),
    zoomOutButton: document.getElementById("zoom-out"),
  });
  spritesheetEditor.resize(4);

  const propertyList = new PropertyList(document.getElementById("property-list"));
  spritesheetEditor.onSelect = (selection) => {
    const { x, y, w, h } = selection;
    const id = y * spritesheetEditor.cols + x;
    propertyList.update({ type: "sprite", x, y, w, h, id });
  };

  const tileList = document.getElementById("tile-list");
  const manager = new TilesetManager(spritesheet, tileList);
  manager.appendEntriesInBatches(50, 1000);

  const saveButton = document.getElementById("save");
  saveButton.addEventListener("click", async () => {
    let hasFailed = true;
    await fetch('/api/tilesets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tileset: "tileset2",
        data: manager.serialize(),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to save tileset');
        return response.json();
      })
      .then(result => {
        hasFailed = false;
        console.log('Server response:', result);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    if (hasFailed) alert("Could not save tileset");
  });

  setupDialog({ 
    dialogId: "dialog-tileset-create", 
    buttonId: "create", 
    onSubmit: (event) => {
      event.preventDefault();
      console.log(event);
    }, 
  });
})();
