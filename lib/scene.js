import { RenderTask } from "./renderer";

export default class Scene {
  constructor(game) {
    this.game = game;
    this.tree = [];
    this.camera = null;
    this.fps = 0;
    this.frameCount = 0;
    this.frameCountTime = 0;
    this.currentPalette = null;
    this.palletes = {
      "nymph": ["#a1ef8c", "#3fac95", "#446176", "#2c2137"], // By Kerrie Lake, https://lospec.com/palette-list/nymph-gb
      "cream": ["#fff6d3", "#f9a875", "#eb6b6f", "#7c3f58"], // By Kerrie Lake, https://lospec.com/palette-list/ice-cream-gb
      "crimson": ["#eff9d6","#ba5044","#7a1c4b","#1b0326"], // By WildLeoKnight, https://lospec.com/palette-list/crimson
    }
  }

  get renderer() { return this.game.renderer }

  addChild(gameObject) {
    gameObject.scene = this;
    this.tree.push(gameObject);
  }

  updateChild(gameObject, dt) {
    gameObject.update(dt);
    for (const child of gameObject.children)
      updateChild(child, dt);
  }

  drawChild(gameObject, dt) {
    gameObject.draw(dt);
    for (const child of gameObject.children)
      drawChild(child, dt);
  }

  update(dt) {
    if (this.game.keys['1']) this.currentPalette = null;
    if (this.game.keys['2']) this.currentPalette = "nymph";
    if (this.game.keys['3']) this.currentPalette = "cream";
    if (this.game.keys['4']) this.currentPalette = "crimson";

    for (const root of this.tree)
      this.updateChild(root, dt);
  }

  draw(dt) {
    const offsetX = this.camera ? Math.round(-this.camera.x) : 0;
    const offsetY = this.camera ? Math.round(-this.camera.y) : 0;
    this.renderer.setOffset("all", offsetX, offsetY);
    this.renderer.setOffset("obj", offsetX, offsetY);
    this.renderer.clear();
    this.renderer.readPixels();

    this.renderer.enqueue("ui", RenderTask.Text, {fontName: "grace", text: `deltaTime: ${dt}ms`, x: 4, y: 1, color: "#000"});
    this.renderer.enqueue("ui", RenderTask.Text, {fontName: "grace", text: `deltaTime: ${dt}ms`, x: 4, y: 0, color: "#ffcc00"});
    const fpsImmediate = 1000 / dt;
    const fpsAverage = this.getFpsAverage(dt, 200);
    this.renderer.enqueue("ui", RenderTask.Text, {fontName: "grace", text: `fps: ${fpsAverage.toFixed(2)} (${fpsImmediate.toFixed(2)})`, x: 4, y: 13, color: "#000"});
    this.renderer.enqueue("ui", RenderTask.Text, {fontName: "grace", text: `fps: ${fpsAverage.toFixed(2)} (${fpsImmediate.toFixed(2)})`, x: 4, y: 12, color: "#ffcc00"});

    const testTiles = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
    ];
    let index = 0;
    for (let y = 0; y < 144; y += 8)
      for (let x = 0; x < 160; x += 8) {
        this.renderer.enqueue("all", RenderTask.Tile, {tilesetId: "tiles", index: testTiles[index], x, y});
        index++;
        index %= testTiles.length;
      }

    for (const root of this.tree)
      this.drawChild(root, dt);
    
    this.renderer.drawLayers();
    const palette = this.palletes[this.currentPalette];
    if (palette)
      this.renderer.applyPalette(...palette);
    this.renderer.flush();

  }

  getFpsAverage(dt, updateInterval = 500) {
    // TODO: I hope that this is accurate, currently I'm at 58fps but it should be 60fps
    this.frameCount++;
    this.frameCountTime += dt;
    if (this.frameCountTime < updateInterval)
      return this.fps;
    this.fps = this.frameCount / this.frameCountTime * 1000;
    this.frameCount = 0;
    this.frameCountTime %= updateInterval;
    return this.fps;
  }

  setCamera(camera) {
    this.camera = camera;
  }
}
