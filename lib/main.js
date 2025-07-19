import Camera from "./camera";
import { getFont } from "./font-drawer";
import BearGame from "./game";
import { fetchPngAsTiles } from "./loader";
import Player from "./player";
import Scene from "./scene";
import { playBoogie } from "./synth";
import { parseMapTemplate, parseTileset } from "./tileset";

async function startGame(canvas) {
  // We could read width and height from canvas, but this is so important, we will override the
  // canvas dimensions instead to guarantee Gameboy dimensions.
  const width = 160;
  const height = 144;
  canvas.width = width;
  canvas.height = height;
  const tileset = await fetchPngAsTiles("/assets/spritesheet.png");
  const rawTilesetDefinition = await fetch("/assets/tileset.txt").then(res => res.text());
  const rawMap = await fetch("/assets/my-map.txt").then(res => res.text());
  const tilesetDefinition = parseTileset(rawTilesetDefinition);
  const mapTemplate = parseMapTemplate(rawMap, tilesetDefinition);
  const font = getFont();
  const bearGame = new BearGame({
    width,
    height,
    canvas,
    resources: [
      { resType: "tileset", resName: "tiles", payload: tileset },
      { resType: "font", resName: "grace", payload: font },
    ]
  });
  const mainScene = new Scene(bearGame);
  bearGame.mainScene = mainScene;
  const player = new Player({ x: 80, y: 72, speed: 0.1 });
  const camera = new Camera(0, 0);
  mainScene.addChild(player);
  mainScene.addChild(camera);
  mainScene.setCamera(camera);
  bearGame.start();
  playBoogie();
}

addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("game");
  await (async () => startGame(canvas))();
});
