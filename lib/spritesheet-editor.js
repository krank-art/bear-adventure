function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default class SpritesheetEditor {
  /**
   * @param {Object} options 
   * @param {HTMLImageElement} options.spritesheet
   * @param {HTMLImageElement} options.image
   * @param {HTMLElement} options.grid
   * @param {number} options.tileSize
   */
  constructor({spritesheet, image, grid, tileSize = 8}) {
    this.spritesheet = spritesheet;
    this.image = image;
    this.image.style.display = "block"; // Show bc initially hidden
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
    this.onScaled = () => {};
    this.onSelect = () => {};
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
    this.image.style.width = this.width * this.scale + "px";
    this.image.style.height = this.height * this.scale + "px";
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

export class SpritesheetZoomer {
  constructor({spritesheetEditor, zoomLabel, zoomInButton, zoomOutButton}) {
    this.spritesheetEditor = spritesheetEditor;
    this.zoomLabel = zoomLabel;
    this.zoomInButton = zoomInButton;
    this.zoomOutButton = zoomOutButton;
    this.setup();
  }

  setup() {
    this.spritesheetEditor.onScaled = (scale) => this.zoomLabel.textContent = `${scale * 100} %`;
    this.zoomInButton.addEventListener("click", () => this.spritesheetEditor.zoomIn());
    this.zoomOutButton.addEventListener("click", () => this.spritesheetEditor.zoomOut());
  }
}
