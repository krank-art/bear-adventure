export const RenderMode = Object.freeze({
  Normal: "normal",
  Pixel: "pixel",
});

export default class Renderer {
  constructor(canvas, mode = RenderMode.Normal) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext("2d");
    this.ctx = ctx;
    this.mode = mode === RenderMode.Pixel ? RenderMode.Pixel : RenderMode.Normal;
  }

  num(number) {
    if (this.mode === RenderMode.Pixel)
      return Math.round(number);
    return number;
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(0, 0, width, height);
  }

  drawRect(x = 0, y = 0, w = 1, h = 1, color = "#f00") {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.num(x), this.num(y), this.num(w), this.num(h));
  }

  drawText(x = 0, y = 0, text = "Hello World", color = "#f00") {
    this.ctx.fillStyle = color;
    this.ctx.font = "8px monospace";
    this.ctx.fillText(text, this.num(x), this.num(y));
  }
}
