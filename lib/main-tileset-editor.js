class SpritesheetEditor {
  constructor(spritesheet, grid, tileSize = 8) {
    this.spritesheet = spritesheet;
    this.grid = grid;
    this.tileSize = tileSize;
    this.width = this.spritesheet.width;
    this.height = this.spritesheet.height;
    this.scale = 1;
    this.cells = [];
    this.selection = { x: null, y: null, w: null, h: null };
    this.selectionFrame = null;
    this.isDragging = false;
    this.setupGrid();
    this.onScaled = null;
    this.onCell = null;
  }

  setupGrid() {
    this.selectionFrame = document.createElement("span");
    this.selectionFrame.classList.add("selection");
    this.grid.appendChild(this.selectionFrame);

    const cols = Math.ceil(this.width / this.tileSize);
    const rows = Math.ceil(this.height / this.tileSize);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const cell = document.createElement("span");
        cell.classList.add("cell");
        cell.style.top = j * this.tileSize / 16 + "em";
        cell.style.left = i * this.tileSize / 16 + "em";
        this.grid.appendChild(cell);
        this.cells.push(cell);
        cell.addEventListener("mousedown", (() => {
          for (const gridCell of this.cells)
            gridCell.classList.remove("active");
          cell.classList.add("active");
          this.updateSelection(i, j);
        }).bind(this));
      }
  }

  setupSelection() {
    this.grid.addEventListener('mousedown', ((e) => {
      this.isDragging = true;
    }).bind(this));

    this.grid.addEventListener('mouseup', ((e) => {
      this.isDragging = false;
    }).bind(this));

    this.grid.addEventListener('mousemove', ((e) => {
      if (!this.isDragging) return;
      const x = Math.round(e.offsetX / this.tileSize);
      const y = Math.round(e.offsetY / this.tileSize);
      console.log(`Mouse at: ${e.clientX}, ${e.clientY}`);
    }).bind(this));
  }

  updateSelection(x, y, w = 1, h = 1) {
    this.selection.x = x;
    this.selection.y = y;
    this.selection.w = w;
    this.selection.h = h;
    if (this.onCell) this.onCell({ ...this.selection });
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

  spritesheetEditor.onCell = (x, y) => console.log(x, y);
});
