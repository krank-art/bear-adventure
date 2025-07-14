// 1. Raw Tiles: Bitmap gets split into 8x8 tiles
// 2. Tileset: Tiles get sorted, assigned a shortcode and grouped into meta-tiles
// 3. Map: A map is built with tiles from the tileset

export function parseTileset(string) {
  const lines = string.split("\n");
  const tileDefinitions = {};
  for (const line of lines) {
    const regex = /(\S{2})\s(\d+)/g; // IMPORTANT! This creates a regex object and keeps state in while loop.
    let match;
    while ((match = regex.exec(line)) !== null) {
      const [, tileId, spriteId] = match;
      if (tileDefinitions.hasOwnProperty(tileId))
        console.warn(`Already tile defined with id '${tileId}', overriding.`);
      tileDefinitions[tileId] = parseInt(spriteId);
    }
  }
  return tileDefinitions;
}

export function parseMapTemplate(string, tileDefinitions) {
  const stringRows = string.trim().split("\n");
  const tiles = [];
  const height = stringRows.length;
  let width = 0;
  for (let j = 0; j < stringRows.length; j++) {
    const stringRow = stringRows[j];
    const tilesPerRow = [];
    const regex = /(\S{2})/g; // IMPORTANT! This creates a regex object and keeps state in while loop.
    let match;
    while ((match = regex.exec(stringRow)) !== null) {
      const [, tileId] = match;
      if (!tileDefinitions.hasOwnProperty(tileId) && tileId !== "..")
        console.warn(`Unknown tile '${tileId}' in map`);
      tilesPerRow.push(tileId);
    }
    width = Math.max(width, tilesPerRow);
    tiles.push(...tilesPerRow);
  }
  return { width, height, tiles };
}

export function isValidTilesetId(id) {
  // There are some extra cases with Windows and Unix with reserved file names (like files musn't start with COM).
  // But we are lazy for now, if it is necessary I will add a function checking for common filename pitfalls.
  return /^[a-zA-Z0-9_-]+$/.test(id);
}
