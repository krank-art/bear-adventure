import GameObject from "./game-object";

export default class Player extends GameObject {
  constructor({x, y, speed}) {
    super();
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  update(dt) {
    super.update(dt);
    if (this.game.keys['w']) this.y -= this.speed * dt;
    if (this.game.keys['s']) this.y += this.speed * dt;
    if (this.game.keys['a']) this.x -= this.speed * dt;
    if (this.game.keys['d']) this.x += this.speed * dt;

    // clamp to canvas bounds
    this.x = Math.max(0, Math.min(this.game.width - 1, this.x));
    this.y = Math.max(0, Math.min(this.game.height - 1, this.y));

  }

  draw(dt) {
    super.draw(dt);
    //this.scene.renderer.drawRect(this.x, this.y, 1, 1, "#0f0");
    this.scene.renderer.drawTile("tiles", 0, this.x - 8, this.y - 8); // Top left
    this.scene.renderer.drawTile("tiles", 1, this.x, this.y - 8);     // Top right
    this.scene.renderer.drawTile("tiles", 32, this.x - 8, this.y);    // Bottom left
    this.scene.renderer.drawTile("tiles", 33, this.x, this.y);        // Bottom right
  }
}
