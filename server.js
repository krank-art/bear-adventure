import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files from the "dist" folder
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/api', express.json());

// Save JSON tileset to disk
app.post('/api/tilesets', async (req, res) => {
  const { tileset: tilesetName, data } = req.body;
  if (!tilesetName || typeof tilesetName !== 'string')
    return res.status(400).json({ error: 'Missing or invalid "name" field' });
  if (!data || typeof data !== 'object')
    return res.status(400).json({ error: 'Missing or invalid "data" field' });
  const filePath = path.join(__dirname, 'data', `${tilesetName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    res.status(200).json({ message: `Tileset "${tilesetName}" saved successfully` });
  } catch (err) {
    console.error('File write error:', err);
    res.status(500).json({ error: 'Failed to save tileset' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
