import GameObject from "./game-object";

export default class Camera extends GameObject {
  constructor(x = 0, y = 0, speed = 0.1) {
    super();
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  update(dt) {
    super.update(dt);
    if (this.game.keys['arrowup']) this.y -= this.speed * dt;
    if (this.game.keys['arrowdown']) this.y += this.speed * dt;
    if (this.game.keys['arrowleft']) this.x -= this.speed * dt;
    if (this.game.keys['arrowright']) this.x += this.speed * dt;
  }

  draw(dt) {
    super.draw(dt);
  }
}
