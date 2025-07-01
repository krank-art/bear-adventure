export default class Scene {
  constructor(game) {
    this.game = game;
    this.tree = [];
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
    for (const root of this.tree)
      this.drawChild(root, dt);
  }
}
