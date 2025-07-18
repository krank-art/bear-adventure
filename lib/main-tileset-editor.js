import { loadImage } from "./loader";
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

function h(tagName, props = {}, children = []) {
  const element = document.createElement(tagName);
  if (typeof props === "text") {
    element.textContent = props;
  } else {
    for (const prop in props) {
      const value = props[prop];
      if (prop === "classes") {
        for (const cssClass of value)
          element.classList.add(cssClass);
        continue;
      }
      element[prop] = value;
    }
  }
  for (const child of children)
    element.appendChild(child);
  return element;
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

/*

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
  const spritesheetEditor = new SpritesheetEditor({
    spritesheet: null,
    image: document.querySelector(".spritesheet"),
    grid: document.querySelector(".spritesheet-grid"),
    scale: 4,
  });
  const zoomer = new SpritesheetZoomer({
    spritesheetEditor: spritesheetEditor,
    zoomLabel: document.getElementById("zoom-label"),
    zoomInButton: document.getElementById("zoom-in"),
    zoomOutButton: document.getElementById("zoom-out"),
  });

  const propertyList = new PropertyList({
    element: document.getElementById("property-list"),
    onPropEdit: (eventType, prop, value) => {
      if (eventType !== "submit") return;
      const { selection: { x, y } } = spritesheetEditor;
      if (!x || !y) return;
      try {
        tilesetManager.updateTile(x, y, { [prop]: value });
      } catch (error) {
        alert(error);
      }
    },
  });
  spritesheetEditor.onSelect = (selection) => {
    const { x, y, w, h } = selection;
    const id = y * spritesheetEditor.cols + x;
    const tile = tilesetManager.getTile(x, y);
    if (tile) {
      const { shortcode, tileName } = tile;
      propertyList.update({ editGroup: "sprite", type: "tile", name: tileName, shortcode, x, y, w, h, id });
      return;
    }
    propertyList.update({ type: "sprite", x, y, w, h, id });
  };

  const tileList = document.getElementById("tile-list");
  const tilesetManager = new TilesetManager({ spritesheet: null, container: tileList });

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

  async function swapTileset(tilesetName) {
    const tileset = await loadTileset(tilesetName);
    const { spritesheet } = await tilesetManager.parse(tileset);
    spritesheetEditor.update(spritesheet);
  }

  const tilesetList = document.getElementById("tileset-list");
  async function updateTilesetList() {
    tilesetList.innerHTML = "";
    const availableTilesets = await fetch("/api/tilesets").then(response => response.json());
    let entries = [];
    if (availableTilesets.length < 1) {
      const notice = h("span", { classes: ["tileset-list-notice"], textContent: "No tilesets found." });
      tilesetList.appendChild(notice);
      return;
    }
    for (const tilesetOverview of availableTilesets) {
      const { ["name"]: tilesetName, image } = tilesetOverview;
      const listEntry = h("li", { classes: ["tileset-list-entry"], textContent: tilesetName });
      listEntry.addEventListener("click", async () => {
        await swapTileset(tilesetName);
        entries.forEach(entry => entry.classList.remove("active"));
        listEntry.classList.add("active");
      });
      entries.push(listEntry);
      tilesetList.appendChild(listEntry);
    }
  }
  await updateTilesetList();

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
      const tilesetNames = availableTilesets.map(tileset => tileset.name);
      if (tilesetNames.includes(tilesetName)) {
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
      tilesetManager.create({ spritesheet: newSpritesheet, tilesetName });
      await saveTileset();
      await swapTileset(tilesetName);
      await updateTilesetList();
      return true;
    }),
  });

  tilesetList.querySelector("li:last-child")?.click();
})();
