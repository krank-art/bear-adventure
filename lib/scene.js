export default class Scene {
  constructor(game) {
    this.game = game;
    this.tree = [];
    this.fps = 0;
    this.frameCount = 0;
    this.frameCountTime = 0;
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
    for (const root of this.tree)
      this.updateChild(root, dt);
  }

  draw(dt) {
    this.renderer.clear();
    this.renderer.readPixels(); 

    const testTiles = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
    ];
    let index = 0;
    for (let y = 0; y < 144; y += 8)
      for (let x = 0; x < 160; x += 8) {
        this.renderer.drawTile("tiles", testTiles[index], x, y);
        index++;
        index %= testTiles.length;
      }

    for (const root of this.tree)
      this.drawChild(root, dt);

    this.renderer.flush();

    this.renderer.drawText(4, 8, `deltaTime: ${dt}ms`, "#ffcc00", "#000");
    const fpsImmediate = 1000 / dt;
    const fpsAverage = this.getFpsAverage(dt, 200);
    this.renderer.drawText(4, 16, `fps: ${fpsAverage.toFixed(2)} (${fpsImmediate.toFixed(2)})`, "#ffcc00", "#000");
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
}
