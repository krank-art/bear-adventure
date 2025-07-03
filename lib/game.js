import Renderer, { RenderMode } from "./renderer";

export default class BearGame {
  #lastFrame = null;

  constructor({ width, height, canvas, mainScene = null, resources = []}) {
    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, RenderMode.Pixel);
    this.renderer.addRenderLayer("ui", 20);
    this.renderer.addRenderLayer("obj", 10);
    this.resources = resources;
    for (const resource of this.resources) 
      this.renderer.loadResource(resource);
    this.mainScene = mainScene;
    this.timeScale = 1;
    this.elapsed = -1;
    this.keys = {};
    window.addEventListener("keydown", (e => this.keys[e.key.toLowerCase()] = true).bind(this));
    window.addEventListener("keyup", (e => this.keys[e.key.toLowerCase()] = false).bind(this));
  }

  loop() {
    const currentFrame = Date.now();
    if (this.#lastFrame === null)
      // For the very first frame, we will assume that dt is 1/60-th of a second
      this.#lastFrame = currentFrame - 17;
    const deltaTime = currentFrame - this.#lastFrame;
    this.#lastFrame = currentFrame;
    this.elapsed += deltaTime;
    this.mainScene.update(deltaTime);
    this.mainScene.draw(deltaTime);
    requestAnimationFrame(this.loop.bind(this));
  }

  start() {
    this.loop();
  }
}
