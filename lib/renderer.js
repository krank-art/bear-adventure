/**
 * https://en.wikipedia.org/wiki/Bit_blit
 * WARNING: We modify targetData instead of returning a new data object.
 * @param {Uint8ClampedArray} tileData 
 * @param {number} tileSize 
 * @param {number} destX 
 * @param {number} destY 
 * @param {Uint8ClampedArray} targetData 
 * @param {number} targetWidth 
 * @param {number} targetHeight 
 */
function blitTile(tileData, tileSize, destX, destY, targetData, targetWidth, targetHeight) {
  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const tileIndex = (y * tileSize + x) * 4;
      const r = tileData[tileIndex];
      const g = tileData[tileIndex + 1];
      const b = tileData[tileIndex + 2];
      const a = tileData[tileIndex + 3];

      if (a === 0) continue; // skip transparent pixels

      const globalX = destX + x;
      const globalY = destY + y;
      if (globalX < 0 || globalX >= targetWidth) continue;
      if (globalY < 0 || globalY >= targetHeight) continue;
      const targetIndex = (globalY * targetWidth + globalX) * 4;

      targetData[targetIndex] = r;
      targetData[targetIndex + 1] = g;
      targetData[targetIndex + 2] = b;
      targetData[targetIndex + 3] = a;
    }
  }
  return targetData;
}

function parseHexColor(hex) {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    // Expand shorthand (#abc → #aabbcc)
    hex = hex.split('').map(c => c + c).join('');
  }

  if (hex.length !== 6) {
    throw new Error('Invalid hex color');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

export const RenderTask = Object.freeze({
  Text: 0,
  Tile: 1,
  MultiTile: 2,
});

export const RenderMode = Object.freeze({
  Normal: "normal",
  Pixel: "pixel",
});

export default class Renderer {
  constructor(canvas, mode = RenderMode.Normal) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext("2d");
    this.ctx = ctx;
    this.mode = mode === RenderMode.Pixel ? RenderMode.Pixel : RenderMode.Normal;
    this.tilesets = {};
    this.fonts = {};
    this.pixelData = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.renderLayers = {};
    this.addRenderLayer("all");
    this.readPixels();
  }

  num(number) {
    if (this.mode === RenderMode.Pixel)
      return Math.round(number);
    return number;
  }

  addRenderLayer(id, zIndex = null) {
    this.renderLayers[id] = { id, zIndex, queue: [], offsetX: 0, offsetY: 0 };
  }

  setOffset(layer, x, y) {
    const renderLayer = this.renderLayers[layer];
    renderLayer.offsetX = x;
    renderLayer.offsetY = y;
  }

  drawLayers() {
    const layers = Object.values(this.renderLayers);
    // Should he have lots of layers each frame, we'd need to sort earlier (upon adding a render layer).
    // As of now its just handier to access render layers via object prop names, if we just had
    // an array, we'd always have to do 'this.renderLayers.find(layer => layer.id === id) which is eugh.
    layers.sort((a, b) => {
      const zA = a.zIndex ?? 0;
      const zB = b.zIndex ?? 0;
      if (zA !== zB) return zA - zB;
      const idA = a.id ?? 0;
      const idB = b.id ?? 0;
      if (idA < idB) return -1;
      if (idA > idB) return 1;
      return 0;
    });
    for (const layer of layers) {
      const { queue, offsetX, offsetY } = layer;
      for (const entry of queue) {
        const { task, payload } = entry;
        const newPayload = { ...payload };
        if (newPayload.hasOwnProperty("x")) newPayload.x = newPayload.x + offsetX;
        if (newPayload.hasOwnProperty("y")) newPayload.y = newPayload.y + offsetY;
        switch (task) {
          case RenderTask.Text: this.drawText2(newPayload); break;
          case RenderTask.Tile: this.drawTile(newPayload); break;
          case RenderTask.MultiTile: this.drawMultiTile(newPayload); break;
          default: console.warn("Unknown render task " + task);
        }
      }
      layer.queue = []; // IMPORTANT! Empty queue
    }
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(0, 0, width, height);
  }

  readPixels() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.pixelData = imageData.data;
  }

  flush() {
    const newImageData = new ImageData(this.pixelData, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(newImageData, 0, 0);
  }

  drawRect(x = 0, y = 0, w = 1, h = 1, color = "#f00") {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.num(x), this.num(y), this.num(w), this.num(h));
  }

  drawText(x = 0, y = 0, text = "Hello World", color = "#f00", shadowColor = null) {
    if (shadowColor) {
      this.ctx.fillStyle = shadowColor;
      this.ctx.fillText(text, this.num(x), this.num(y + 1));
    }
    this.ctx.fillStyle = color;
    this.ctx.font = "8px monospace";
    this.ctx.fillText(text, this.num(x), this.num(y));
  }

  drawTile({ tilesetId, index, x = 0, y = 0 }) {
    // Requires flush to be visible
    const tileset = this.tilesets[tilesetId];
    const { tileSize, tiles } = tileset;
    const tileData = tiles[index];
    blitTile(tileData, tileSize, Math.round(x), Math.round(y), this.pixelData, this.canvas.width, this.canvas.height);
  }
  
  drawMap({mapTemplate, tilesetId, tileDef, tileSize, x, y}) {
    const tileset = this.tilesets[tilesetId]; // TODO get tile def to map tileid to spriteid
    const { width, height, tiles} = mapTemplate;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = i + j * width;
        const currentTile = tiles[index];
        //TODO
      }
    }
  }

  drawText2({ fontName, text, x = 0, y = 0, color = "#f00", lineSpacing = 1, letterSpacing = 1 }) {
    let charX = Math.round(x);
    let charY = Math.round(y);
    const font = this.fonts[fontName];
    const nullGlyph = font["null"];
    const fontHeight = nullGlyph.w;
    const lines = text.split("\n");
    for (let j = 0; j < lines.length; j++) {
      charY += fontHeight + lineSpacing;
      for (const char of text) {
        const glyph = font[char] ?? font["null"];
        const { w } = glyph;
        if (char !== " ")
          this.drawChar(fontName, char, charX, charY, ...parseHexColor(color));
        charX += w + letterSpacing;
      }
    }
  }

  drawChar(fontName, char, x = 0, y = 0, r = 255, g = 0, b = 0) {
    const font = this.fonts[fontName];
    const glyph = font[char] ?? font["null"];
    const { w, h, bits } = glyph;
    const startX = Math.round(x);
    const startY = Math.round(y);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const index = i + j * w;
        const bit = bits[index];
        if (bit !== 1) continue;
        const pixelX = startX + i;
        const pixelY = startY + j;
        if (pixelX < 0 || pixelX >= this.canvas.width) continue;
        if (pixelY < 0 || pixelY >= this.canvas.height) continue;
        const pixelIndex = (pixelX + pixelY * this.canvas.width) * 4;
        this.pixelData[pixelIndex] = r;
        this.pixelData[pixelIndex + 1] = g;
        this.pixelData[pixelIndex + 2] = b;
        //this.pixelData[pixelIndex + 3] = a;
      }
    }
  }

  enqueue(layerId, task, payload) {
    const layer = this.renderLayers[layerId];
    layer.queue.push({ task, payload });
  }

  drawMultiTile({ tilesetId, index, x = 0, y = 0, w = 1, h = 1 }) {
    const tileset = this.tilesets[tilesetId];
    const { tileCols, tileSize, tiles } = tileset;
    const startTileX = index % tileCols;
    const startTileY = Math.floor(index / tileCols);
    const startDrawX = Math.round(x);
    const startDrawY = Math.round(y);
    for (let j = 0; j < w; j++)
      for (let i = 0; i < h; i++) {
        const currentTileX = startTileX + i;
        const currentTileY = (startTileY + j) * tileCols;
        const tileIndex = currentTileX + currentTileY;
        const tileData = tiles[tileIndex];
        const currentDrawX = startDrawX + tileSize * i;
        const currentDrawY = startDrawY + tileSize * j;
        blitTile(tileData, tileSize, currentDrawX, currentDrawY, this.pixelData, this.canvas.width, this.canvas.height);
      }
  }

  loadResource({ resType, resName, payload }) {
    switch (resType) {
      case "font":
        this.fonts[resName] = payload;
        break;
      case "tileset":
        this.tilesets[resName] = payload;
        break;
      default:
        throw new Error("Don't know how to load " + resType);
    }
  }

  applyPalette(c1, c2, c3, c4) {
    // c1 lightest, c4 darkest
    const pixelData = this.pixelData;
    const pixels = pixelData.length;
    const colors = [c1, c2, c3, c4].map(color => parseHexColor(color));
    let newColor = colors[3];
    for (let i = 0; i < pixels; i+=4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3];
      const luminance = (r * 3 + g * 6 + b) >> 3; // fast luminance, returns 0-318
      if (luminance > 240) newColor = colors[0];
      else if (luminance > 160) newColor = colors[1];
      else if (luminance > 80) newColor = colors[2];
      else newColor = colors[3];
      pixelData[i] = newColor[0]
      pixelData[i + 1] = newColor[1]
      pixelData[i + 2] = newColor[2]
      pixelData[i + 3] = a;
    }
  }
}
