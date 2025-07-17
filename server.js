import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isValidTilesetId } from './lib/tileset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tilesetDir = path.join(__dirname, 'tilesets');

function loadTileset(id) {
  const filepath = path.join(tilesetDir, id + ".json");
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}
function saveTileset(id, data) {
  const filepath = path.join(tilesetDir, id + ".json");
  fs.writeFileSync(filepath, JSON.stringify(data));
}
function doesTilesetExist(id) {
  const filepath = path.join(tilesetDir, id + ".json");
  return fs.existsSync(filepath);
}

const app = express();
const PORT = 3001;

// Serve static files from the "dist" folder
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/api', express.json());
app.get('/api/tilesets', (req, res) => {
  const entries = fs.readdirSync(tilesetDir);
  const jsonFiles = entries.filter(file => file.endsWith('.json'));
  const tilesets = jsonFiles.map(file => {
    const id = path.parse(file).name;
    const data = loadTileset(id);
    const tilesLength = data.tiles.length;
    const metatilesLength = data.metatiles.length;
    delete data.tiles;
    delete data.metatiles;
    return { ...data, metatilesLength, tilesLength };
  } );
  res.json(tilesets);
});
app.get('/api/tilesets/:id', (req, res) => {
  // GET /api/tilesets/:id (read)
  const tilesetId = req.params.id;
  if (!isValidTilesetId(tilesetId))
    return res.status(400).json({ error: 'Invalid tileset ID format.' });
  const tileset = loadTileset(tilesetId);
  if (!tileset) return res.status(404).json({ error: 'Tileset not found' });
  res.json(tileset);
});
app.put('/api/tilesets/:id', (req, res) => {
  // PUT /api/tilesets (update)
  // This also functions as POST (create), because POST would require that no id is specified in API design.
  // Also the body function for creation and updating in this case is the same, the only way to know if a tileset
  // was newly created on disk is if the client receives a 201 (Created) status code instead of 200 (OK).
  const tilesetId = req.params.id;
  if (!isValidTilesetId(tilesetId))
    return res.status(400).json({ error: 'Invalid tileset ID format.' });
  const tilesetData = req.body;
  const statusCode = doesTilesetExist(tilesetId) ? 200 : 201;
  try {
    saveTileset(tilesetId, tilesetData);
    res.status(statusCode).json({ id: tilesetId, ...tilesetData });
  } catch (err) {
    console.error('File write error:', err);
    res.status(500).json({ error: 'Failed to save tileset' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
