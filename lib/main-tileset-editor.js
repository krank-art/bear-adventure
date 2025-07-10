function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class TileEntry {
  constructor({image, imageWidth, imageHeight, x, y, cropWidth, cropHeight, title, description, scale = 1}) {
    this.element = TileEntry.hydrate();
    this.image = image;
    this.x = x;
    this.y = y;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.cropWidth = cropWidth;
    this.cropHeight = cropHeight;
    this.title = title;
    this.description = description;
    this.scale = scale;
    this.update();
  }

  static hydrate() {
    const entry = document.createElement("div");
    entry.classList.add("tile-entry");
    return entry;
  }

  update() {
    this.element.innerHTML = `
      <div class="entry-figure">
        <span class="entry-image" aria-label="${this.title}">
      </div>
      <span class="entry-title">${this.title}</span>
      <span class="entry-description">${this.description}</span>
    `;
    const image = this.element.querySelector(".entry-image");
    image.style.backgroundImage = `url("${this.image}")`;
    //image.style.backgroundRepeat = 'no-repeat';
    image.style.backgroundSize = `${this.imageWidth * this.scale}px ${this.imageHeight * this.scale}px`;
    image.style.backgroundPosition = `-${this.x * this.scale}px -${this.y * this.scale}px`;
    image.style.width = `${this.cropWidth * this.scale}px`;
    image.style.height = `${this.cropHeight * this.scale}px`;
  }
}

class SpritesheetEditor {
  constructor(spritesheet, grid, tileSize = 8) {
    this.spritesheet = spritesheet;
    this.grid = grid;
    this.tileSize = tileSize;
    this.width = this.spritesheet.width;
    this.height = this.spritesheet.height;
    this.scale = 1;
    this.selection = { x: null, y: null, w: null, h: null };
    this.selectionFrame = null;
    this.isDragging = false;
    this.setupGrid();
    this.setupSelection();
    this.onScaled = null;
    this.onSelect = null;
    this.cols = Math.ceil(this.spritesheet.width / this.tileSize);
    this.rows = Math.ceil(this.spritesheet.height / this.tileSize);
  }

  setupGrid() {
    this.selectionFrame = document.createElement("span");
    this.selectionFrame.classList.add("selection");
    this.grid.appendChild(this.selectionFrame);

    const cols = Math.ceil(this.width / this.tileSize);
    const rows = Math.ceil(this.height / this.tileSize);
    for (let j = 0; j < rows; j++) {
      const row = document.createElement("span");
      row.classList.add("row");
      row.style.top = j * this.tileSize / 16 + "em";
      this.grid.appendChild(row);
    }
    for (let i = 0; i < cols; i++) {
      const col = document.createElement("span");
      col.classList.add("col");
      col.style.left = i * this.tileSize / 16 + "em";
      this.grid.appendChild(col);
    }
  }

  setupSelection() {
    this.grid.addEventListener('mousedown', this.onMouseAction.bind(this));
    this.grid.addEventListener('mousemove', this.onMouseAction.bind(this));
  }

  onMouseAction(event) {
    const leftMouseButtonIsPressed = event.buttons & 1; // This also works if LMB and RMB are flipped
    if (!leftMouseButtonIsPressed) return;
    event.preventDefault();
    this.select(event.offsetX, event.offsetY);
  }

  select(x, y) {
    const i = Math.floor(x / (this.tileSize * this.scale));
    const j = Math.floor(y / (this.tileSize * this.scale));
    const clampedI = clamp(i, 0, this.cols - 1);
    const clampedJ = clamp(j, 0, this.rows - 1);
    this.updateSelection(clampedI, clampedJ);
  }

  updateSelection(x, y, w = 1, h = 1) {
    this.selection.x = x;
    this.selection.y = y;
    this.selection.w = w;
    this.selection.h = h;
    if (this.onSelect) this.onSelect({ ...this.selection });
    this.selectionFrame.style.display = "inline-block";
    this.selectionFrame.style.top = this.selection.y * 0.5 + "em";
    this.selectionFrame.style.left = this.selection.x * 0.5 + "em";
    this.selectionFrame.style.width = this.selection.w * 0.5 + "em";
    this.selectionFrame.style.height = this.selection.h * 0.5 + "em";
  }

  resize(scale) {
    this.scale = scale;
    this.spritesheet.style.width = this.width * this.scale + "px";
    this.spritesheet.style.height = this.height * this.scale + "px";
    this.grid.style.fontSize = 1 * this.scale + "rem";
    if (this.onScaled) this.onScaled(this.scale);
  }

  zoomIn() {
    const newScale = Math.min(10, this.scale + 1);
    this.resize(newScale);
  }

  zoomOut() {
    const newScale = Math.max(1, this.scale - 1);
    this.resize(newScale);
  }
}

function executeWhenImageIsLoaded(img, action, retryTime = 200) {
  const interval = setInterval(() => {
    if (img.complete && img.naturalWidth !== 0) {
      clearInterval(interval);
      action();
    }
  }, retryTime);
}

const spritesheet = document.querySelector(".spritesheet");
const grid = document.querySelector(".spritesheet-grid");
let spritesheetEditor = null;
executeWhenImageIsLoaded(spritesheet, () => {

  // Native image event 'load' is not fired when image got cached in Firefox.
  spritesheetEditor = new SpritesheetEditor(spritesheet, grid);
  const zoomLabel = document.getElementById("zoom-label");
  spritesheetEditor.onScaled = (scale) => zoomLabel.textContent = `${scale * 100} %`;
  spritesheetEditor.resize(4);
  spritesheet.style.display = "block";

  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  zoomInButton.addEventListener("click", () => spritesheetEditor.zoomIn());
  zoomOutButton.addEventListener("click", () => spritesheetEditor.zoomOut());

  spritesheetEditor.onSelect = (selection) => console.log(selection);

  const inspector = document.querySelector(".inspector");
  const entry = new TileEntry({
    image: "/assets/spritesheet.png", 
    imageWidth: 256, 
    imageHeight: 256, 
    x: 0, 
    y: 0, 
    cropWidth: 16, 
    cropHeight: 16, 
    title: "bobby", 
    description: "bla", 
    scale: 2,
  });
  inspector.appendChild(entry.element);
});
