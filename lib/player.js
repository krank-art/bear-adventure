import GameObject from "./game-object";
import { RenderTask } from "./renderer";

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

    this.y = 120 - Math.abs(Math.sin(this.game.elapsed * 0.003)) * 40;
  }

  draw(dt) {
    super.draw(dt);
    //this.scene.renderer.drawRect(this.x, this.y, 1, 1, "#0f0");
    this.scene.renderer.enqueue("obj", RenderTask.MultiTile, "tiles", 448, this.x - 16, this.y - 32, 4, 4);
  }
}
