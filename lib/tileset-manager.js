import { loadImage } from "./loader";

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

export const TilesetFileVersion = 1;

export default class TilesetManager {
  constructor({ spritesheet, container, tilesetName, tileSize = 8, batchSize = 50, batchDelay = 1000 }) {
    this.spritesheet = spritesheet;
    this.width = null;
    this.height = null;
    this.tilesetName = tilesetName;
    this.container = container;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.tileSize = tileSize;
    this.tiles = null;
    this.cancelLoadingTiles = null;
    if (this.spritesheet)
      this.update({ spritesheet: this.spritesheet, tileSize: this.tileSize });
  }

  create({ spritesheet, tilesetName, tileSize = 8 }) {
    this.tilesetName = tilesetName;
    this.spritesheet = spritesheet;
    this.width = this.spritesheet.width;
    this.height = this.spritesheet.height;
    this.tileSize = tileSize;
    this.tiles = this.generateTilesFromVisible();
  }

  update({ spritesheet = this.spritesheet, tilesetName = this.tilesetName, tileSize = this.tileSize, tiles = this.tiles }) {
    if (this.cancelLoadingTiles)
      this.cancelLoadingTiles();
    this.spritesheet = spritesheet;
    this.width = this.spritesheet.width;
    this.height = this.spritesheet.height;
    this.tilesetName = tilesetName;
    this.tileSize = tileSize;
    this.tiles = [...tiles];
    this.container.innerHTML = "";
    const { cancel } = this.appendEntriesInBatches(this.batchSize, this.batchDelay);
    this.cancelLoadingTiles = cancel;
  }

  generateTiles() {
    const cols = Math.ceil(this.width / this.tileSize);
    const rows = Math.ceil(this.height / this.tileSize);
    const tiles = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const index = j * rows + i;
        const tile = new Tile({
          spritesheet: this.spritesheet,
          tileName: index,
          shortcode: index.toString(16).padStart(0),
          id: index,
          x: i * this.tileSize,
          y: j * this.tileSize,
          width: this.tileSize,
          height: this.tileSize,
        });
        tiles.push(tile);
      }
    }
    return tiles;
  }

  generateTilesFromVisible() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const { width, height, tileSize, spritesheet } = this;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(spritesheet, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tiles = [];
    const cols = Math.ceil(width / tileSize);
    for (let tileY = 0; tileY < height; tileY += tileSize) {
      for (let tileX = 0; tileX < width; tileX += tileSize) {
        const j = tileY / tileSize;
        const i = tileX / tileSize;
        let allTransparent = true;
        for (let y = 0; y < tileSize; y++) {
          for (let x = 0; x < tileSize; x++) {
            const px = tileX + x;
            const py = tileY + y;
            if (px >= width || py >= height) continue;
            const index = (py * width + px) * 4; // RGBA = 4 bytes per pixel
            const alpha = data[index + 3];
            if (alpha !== 0) {
              allTransparent = false;
              break;
            }
          }
          if (!allTransparent) break;
        }
        if (allTransparent) continue;
        const tileIndex = j * cols + i;
        tiles.push(new Tile({
          spritesheet: this.spritesheet,
          tileName: tileIndex,
          shortcode: tileIndex.toString(16).padStart(0),
          id: tileIndex,
          x: tileX,
          y: tileY,
          width: this.tileSize,
          height: this.tileSize,
        }));
      }
    }
    return tiles;
  }

  appendEntriesInBatches(batchSize, delay) {
    let canceled = false;
    const cancel = () => { canceled = true };
    const total = this.tiles.length;
    const promise = new Promise((resolve) => {
      let created = 0;
      const addBatch = () => {
        if (canceled) return resolve(); // Stop early
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < batchSize && created < total; i++, created++) {
          const tile = this.tiles[created];
          tile.hydrate();
          fragment.appendChild(tile.entry.element);
        }
        this.container.appendChild(fragment);
        if (created < total) setTimeout(addBatch.bind(this), delay);
        else resolve(); // All elements added
      }
      addBatch();
    });
    return { promise, cancel };
  }

  async parse(rawTileset) {
    const { version, name: tilesetName, image, width, height, tileSize, metatiles, tiles: dryTiles } = rawTileset;
    if (version !== TilesetFileVersion)
      throw new Error(`Version mismatch in tileset file format (${version}), expected ${TilesetFileVersion}`);
    if (!tilesetName || tilesetName.length === 0)
      throw new Error(`No tileset name specified`);
    const spritesheet = await loadImage(image); // Maybe we should skip loading this, but
    if (width !== spritesheet.width)
      console.warn(`Mismatch in tileset image width (is ${spritesheet.width}, expected ${width}). `);
    if (height !== spritesheet.height)
      console.warn(`Mismatch in tileset image height (is ${spritesheet.height}, expected ${height}). `);
    if (metatiles) { /* TODO */ }
    const hydratedTiles = [];
    const knownTileIds = new Set();
    const cols = Math.ceil(spritesheet.width / tileSize);
    const rows = Math.ceil(spritesheet.height / tileSize);
    for (const dryTile of dryTiles) {
      const [tileName, shortCode, id, x, y] = dryTile;
      const i = Math.floor(x / tileSize);
      const j = Math.floor(y / tileSize);
      if (knownTileIds.has(id)) {
        console.warn(`We already have a tile with id ${id}, skipping.`);
        continue;
      }
      knownTileIds.add(id);
      if (!tileName || tileName.length < 1) console.warn("No name for tile id " + id);
      if (shortCode.length > 2) console.warn("Illegal length for tile shortcode for id " + id);
      if (i < 0) console.warn("Tile X cannot be below 0 for id " + id);
      if (j < 0) console.warn("Tile Y cannot be below 0 for id " + id);
      if (i > cols - 1) console.warn("Tile X is outside of spritesheet bounds for id " + id);
      if (j > rows - 1) console.warn("Tile Y is outside of spritesheet bounds for id " + id);
      hydratedTiles.push(new Tile({
        spritesheet: spritesheet,
        tileName: tileName,
        shortcode: shortCode,
        id: id,
        x: i * tileSize,
        y: j * tileSize,
        width: tileSize,
        height: tileSize,
      }));
    }
    this.update({ spritesheet, tilesetName, tileSize, tiles: hydratedTiles });
    return { spritesheet };
  }

  serialize() {
    const tiles = this.tiles.map(tile => {
      const { spritesheet: tileSpritesheet, tileName, shortcode, id, x, y } = tile;
      if (tileSpritesheet !== this.spritesheet)
        throw new Error(`Invalid spritesheet on tile ${tileName}`);
      return [tileName, shortcode, id, x, y];
    });
    return {
      version: TilesetFileVersion,
      name: this.tilesetName,
      image: new URL(this.spritesheet.src).pathname,
      width: this.spritesheet.width,
      height: this.spritesheet.height,
      tileSize: this.tileSize,
      metatiles: [], //TODO
      tiles: tiles,
    }
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
      image: this.spritesheet.src,
      imageWidth: this.spritesheet.width,
      imageHeight: this.spritesheet.height,
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
