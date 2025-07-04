async function fetchPngAndGetImageData(url) {
  // 1. Fetch the PNG file as a Blob
  const response = await fetch(url);
  const blob = await response.blob();

  // 2. Decode image into an ImageBitmap
  const bitmap = await createImageBitmap(blob);

  // 3. Draw to an offscreen (or temp) canvas
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  // 4. Extract ImageData (RGBA array)
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  return imageData;
}

function splitImageDataIntoTiles(imageData, tileSize = 8) {
  const { width, height, data } = imageData;
  const tiles = [];

  const pixelsPerTile = tileSize * tileSize * 4;

  for (let ty = 0; ty < height; ty += tileSize) {
    for (let tx = 0; tx < width; tx += tileSize) {
      const tilePixels = new Uint8ClampedArray(pixelsPerTile);
      let p = 0; // position in tilePixels

      for (let y = 0; y < tileSize; y++) {
        for (let x = 0; x < tileSize; x++) {
          const globalX = tx + x;
          const globalY = ty + y;

          const i = (globalY * width + globalX) * 4;

          tilePixels[p++] = data[i];     // R
          tilePixels[p++] = data[i + 1]; // G
          tilePixels[p++] = data[i + 2]; // B
          tilePixels[p++] = data[i + 3]; // A
        }
      }

      tiles.push(tilePixels);
    }
  }

  return tiles;
}

export async function fetchPngAsTiles(url) {
  const imageData = await fetchPngAndGetImageData(url);
  const tileSize = 8;
  const width = imageData.width;
  const height = imageData.height;
  const tileCols = width / tileSize;
  const tileRows = height / tileSize;
  const tiles = splitImageDataIntoTiles(imageData, tileSize);
  return { width, height, tileCols, tileRows, tileSize, tiles };
}
