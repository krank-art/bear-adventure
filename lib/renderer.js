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
    this.renderLayers[id] = { id, zIndex, queue: [] };
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
      const { queue } = layer;
      for (const entry of queue) {
        const { task, payload } = entry;
        switch (task) {
          case RenderTask.Text: this.drawText(...payload); break;
          case RenderTask.Tile: this.drawTile(...payload); break;
          case RenderTask.MultiTile: this.drawMultiTile(...payload); break;
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

  drawTile(tilesetId, index, x = 0, y = 0) {
    // Requires flush to be visible
    const tileset = this.tilesets[tilesetId];
    const { tileSize, tiles } = tileset;
    const tileData = tiles[index];
    blitTile(tileData, tileSize, Math.round(x), Math.round(y), this.pixelData, this.canvas.width, this.canvas.height);
  }

  enqueue(layerId, task, ...payload) {
    const layer = this.renderLayers[layerId];
    layer.queue.push({task, payload});
  }

  drawMultiTile(tilesetId, index, x = 0, y = 0, w = 1, h = 1) {
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
    if (resType !== "tileset") {
      console.warn("Don't know how to load " + resType);
      return;
    }
    this.tilesets[resName] = payload;
  }
}
