function TileEntry({ image, imageWidth, imageHeight, x, y, cropWidth, cropHeight, title, description, scale = 1 }) {
  // For this performance actually matters. A prototype-styled class is faster than with a class based syntax.
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

TileEntry.hydrate = function hydrate() {
  const entry = document.createElement("div");
  entry.classList.add("tile-entry");
  return entry;
}

TileEntry.prototype.update = function update() {
  this.element.innerHTML = `
      <div class="entry-figure">
        <span class="entry-image" aria-label="${this.title}">
      </div>
      <span class="entry-title">${this.title}</span>
    `;
  const image = this.element.querySelector(".entry-image");
  image.style.backgroundImage = `url("${this.image}")`;
  //image.style.backgroundRepeat = 'no-repeat';
  image.style.backgroundSize = `${this.imageWidth * this.scale}px ${this.imageHeight * this.scale}px`;
  image.style.backgroundPosition = `-${this.x * this.scale}px -${this.y * this.scale}px`;
  image.style.width = `${this.cropWidth * this.scale}px`;
  image.style.height = `${this.cropHeight * this.scale}px`;
}

export default class TilesetManager {
  constructor(spritesheet, width, height, entryContainer, tileSize = 8) {
    this.spritesheet = spritesheet;
    this.width = width;
    this.height = height;
    this.entryContainer = entryContainer;
    this.tileSize = tileSize;
    this.tiles = [];
    this.loadTiles();
  }

  loadTiles() {
    const cols = Math.ceil(this.width / this.tileSize);
    const rows = Math.ceil(this.height / this.tileSize);
    const fragment = document.createDocumentFragment();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const index = j * rows + i;
        const tile = new Tile({
          spritesheet: spritesheet,
          tileName: index,
          shortcode: index.toString(16).padStart(0),
          id: index,
          x: i * this.tileSize,
          y: j * this.tileSize,
          width: this.tileSize,
          height: this.tileSize,
        });
        this.tiles.push(tile);
        //fragment.appendChild(tile.entry.element);
      }
    }
    this.entryContainer.appendChild(fragment);
  }

  async appendEntriesInBatches(batchSize, delay) {
    const total = this.tiles.length;
    return new Promise((resolve) => {
      let created = 0;
      const addBatch = () => {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < batchSize && created < total; i++, created++) {
          const tile = this.tiles[created];
          tile.hydrate();
          fragment.appendChild(tile.entry.element);
        }
        this.entryContainer.appendChild(fragment);
        if (created < total) setTimeout(addBatch.bind(this), delay);
        else resolve(); // All elements added
      }
      addBatch();
    });
  }
}

class Tile {
  constructor({ spritesheet, tileName, shortcode, id, x, y, width, height }) {
    this.spritesheet = spritesheet;
    this.tileName = tileName;
    this.shortcode = shortcode;
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.entry = null;
  }

  hydrate() {
    this.entry = new TileEntry({
      image: spritesheet.src,
      imageWidth: spritesheet.width,
      imageHeight: spritesheet.height,
      x: this.x,
      y: this.y,
      cropWidth: this.width,
      cropHeight: this.height,
      title: this.tileName,
      description: [this.shortcode, this.id, this.x, this.y, this.width, this.height].join(", "),
      scale: 2,
    });
  }
}
