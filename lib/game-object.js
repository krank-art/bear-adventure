export default class GameObject {
  constructor() {
    this.scene = null;
    this.parent = null;
    this.children = [];
    this.components = [];
  }
  get game() { return this.scene.game }
  update(dt) {
    for (const component of this.components)
      component.update(dt);
  }
  draw(dt) {
    for (const component of this.components)
      component.draw(dt);
  }
}
