import Phaser from "phaser";

import { GameScene } from "./GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  scene: [GameScene],
  physics: {
    default: "arcade", // Specifies Arcade Physics as the default system
    arcade: {
      gravity: { x: 0, y: 300 }, // Sets a global gravity for the arcade physics world.
      // Your FoodItems have their own gravityY set in spawnFood,
      // so this global gravity might be overridden or additive
      // depending on how Phaser handles it. You might set this to { y: 0 }
      // if you only want to control gravity per-object.
      debug: false, // Useful for development to see physics bodies.
    },
  },
};

new Phaser.Game(config);
