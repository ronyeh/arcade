import Phaser from 'phaser';

export class FoodItem extends Phaser.Physics.Arcade.Sprite {
  public type: string;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: string) {
    super(scene, x, y, texture);
    this.type = type;

    // Add to scene's display list
    scene.add.existing(this);
    // Enable physics
    scene.physics.add.existing(this);

    // Set some basic physics properties
    if (this.body instanceof Phaser.Physics.Arcade.Body) {
      this.body.setCollideWorldBounds(false); // Allow to go out of bounds to be destroyed
    }
  }
}
