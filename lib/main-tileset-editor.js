import PageViewer from "./page-viewer";
import PropertyList from "./property-list";
import SpritesheetEditor, { SpritesheetZoomer } from "./spritesheet-editor";
import { isValidTilesetId } from "./tileset";
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
  form.addEventListener("submit", async (event) => {
    const succeeded = await onSubmit(event);
    if (!!succeeded) dialog.close();
  });
}

/*
async function loadTileset(id) {
  try {
    const response = await fetch(`/api/tilesets/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`Failed to load tileset: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Error loading tileset:', err);
    return null;
  }
}

async function doesFileExistOnServer(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    if (response.ok) {
      resolve();
    } else {
      reject('File does not exist (status:', response.status, ')');
    }
  } catch (error) {
    console.error('Error checking file:', error);
    reject(error);
  }
}
*/

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
  const tilesetManager = new TilesetManager({ spritesheet, container: tileList });
  //const { cancel: cancelGeneratingTileEntries } = manager.appendEntriesInBatches(50, 1000);
  //setTimeout(() => cancelGeneratingTileEntries(), 3333);

  async function saveTileset() {
    let hasFailed = true;
    const tilesetData = tilesetManager.serialize();
    const { name: tilesetName } = tilesetData;
    await fetch(`/api/tilesets/${tilesetName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tilesetData),
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
  }

  const saveButton = document.getElementById("save");
  saveButton.addEventListener("click", saveTileset);

  async function swapTileset(spritesheet, tilesetName) {
    spritesheetEditor.update(spritesheet);
    tilesetManager.update(spritesheet, tilesetName);
  }

  setupDialog({
    dialogId: "dialog-tileset-create",
    buttonId: "create",
    onSubmit: (async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData.entries());
      const { ["tileset-name"]: tilesetName, ["image-src"]: imageSrc } = data;
      // Validate inputs
      if (!isValidTilesetId(tilesetName)) {
        alert('Illegal characters for tileset name. Valid characters are a-z, A-Z, 0-9, _ and -.');
        return;
      }
      const availableTilesets = await fetch("/api/tilesets").then(response => response.json());
      if (availableTilesets.includes(tilesetName)) {
        alert(`There already is a tileset named '${tilesetName}'. `);
        return;
      }
      if (!imageSrc || !imageSrc.startsWith('/assets/')) {
        alert('Image source must start with /assets/.');
        return;
      }
      let newSpritesheet;
      try {
        newSpritesheet = await loadImage(imageSrc);
      } catch (error) {
        alert("Could not load image");
        return;
      }
      swapTileset(newSpritesheet, tilesetName);
      await saveTileset();
      return true;
    }),
  });
})();
