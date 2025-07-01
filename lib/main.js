import BearGame from "./game";
import Player from "./player";
import Scene from "./scene";

function startGame(canvas) {
  // We could read width and height from canvas, but this is so important, we will override the
  // canvas dimensions instead to guarantee Gameboy dimensions.
  const width = 160;
  const height = 144;
  canvas.width = width;
  canvas.height = height;
  const bearGame = new BearGame({ width, height, canvas });
  const mainScene = new Scene(bearGame);
  bearGame.mainScene = mainScene;
  const player = new Player({ x: 80, y: 72, speed: 0.1});
  mainScene.addChild(player);
  bearGame.start();
}

addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game");
  startGame(canvas);
});
