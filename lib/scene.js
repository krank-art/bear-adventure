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
    this.renderer.drawText(4, 8, `deltaTime: ${dt}ms`, "#aaa");
    const fpsImmediate = 1000 / dt;
    const fpsAverage = this.getFpsAverage(dt, 200);
    this.renderer.drawText(4, 16, `fps: ${fpsAverage.toFixed(2)} (${fpsImmediate.toFixed(2)})`, "#aaa");
    for (const root of this.tree)
      this.drawChild(root, dt);
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
