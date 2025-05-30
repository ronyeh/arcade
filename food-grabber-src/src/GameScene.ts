import Phaser from 'phaser';
import { FoodItem } from './FoodItem';

export class GameScene extends Phaser.Scene {
  private foodItemGroup!: Phaser.Physics.Arcade.Group;
  private targetFoodText!: Phaser.GameObjects.Text;
  private foodTypes: string[] = ['apple', 'banana', 'sushi'];
  private currentTargetType!: string;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private changeTargetTimer!: Phaser.Time.TimerEvent;
  private isGameOver: boolean = false;
  private gameOverText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // console.log('GameScene: preload');
    this.load.image('apple', 'assets/apple.png');
    this.load.image('banana', 'assets/banana.png');
    this.load.image('sushi', 'assets/sushi.png');
  }

  create() {
    // console.log('GameScene: create');

    this.foodItemGroup = this.physics.add.group({
      classType: FoodItem,
      runChildUpdate: true,
    });

    this.targetFoodText = this.add.text(
      this.cameras.main.width / 2,
      50,
      '',
      { fontSize: '32px', color: '#fff', backgroundColor: '#333' }
    ).setOrigin(0.5).setPadding(10);

    this.gameOverText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Game Over!\nClick to Restart',
      { fontSize: '48px', color: '#ff0000', align: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }
    ).setOrigin(0.5).setPadding(20).setVisible(false).setDepth(100);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjectsClicked: Phaser.GameObjects.GameObject[]) => {
      if (this.isGameOver) {
        this.restartGame();
      } else {
        if (gameObjectsClicked.length > 0 && gameObjectsClicked[0] instanceof FoodItem) {
          this.handleFoodItemClicked(gameObjectsClicked[0] as FoodItem);
        }
      }
    });
    
    this.resetGame();
  }
  
  private resetGame() {
    this.isGameOver = false;
    this.gameOverText.setVisible(false);
    this.foodItemGroup.clear(true, true);

    this.selectNewTargetFood();

    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnFood,
      callbackScope: this,
      loop: true
    });

    if (this.changeTargetTimer) this.changeTargetTimer.remove();
    this.changeTargetTimer = this.time.addEvent({
      delay: 7000,
      callback: this.selectNewTargetFood,
      callbackScope: this,
      loop: true
    });
    
    // Initial spawn
    this.spawnFood();
    console.log('Game (re)started.');
  }

  update() {
    if (this.isGameOver) return;

    this.foodItemGroup.getChildren().forEach(item => {
      const foodItem = item as FoodItem;
      if (foodItem.y > this.cameras.main.height + foodItem.height) {
        if (foodItem.active) foodItem.destroy();
      }
    });
  }

  private selectNewTargetFood() {
    if (this.isGameOver) return;
    this.currentTargetType = Phaser.Math.RND.pick(this.foodTypes);
    this.targetFoodText.setText(`Click ${this.currentTargetType.charAt(0).toUpperCase() + this.currentTargetType.slice(1)}!`);
    // console.log('New target food:', this.currentTargetType);
  }

  private handleFoodItemClicked(foodItem: FoodItem) {
    if (this.isGameOver || !foodItem.active) return;

    if (foodItem.type === this.currentTargetType) {
      // console.log('Correct! Clicked:', foodItem.type);
      foodItem.destroy();
      this.selectNewTargetFood();
    } else {
      this.triggerGameOver(foodItem);
    }
  }
  
  private triggerGameOver(clickedItem?: FoodItem) {
    console.log(`Incorrect! Clicked: ${clickedItem?.type || 'nothing'}, Expected: ${this.currentTargetType}. Game Over.`);
    this.isGameOver = true;
    this.gameOverText.setVisible(true);

    this.spawnTimer.paused = true;
    this.changeTargetTimer.paused = true;

    this.foodItemGroup.getChildren().forEach(item => {
      const foodSprite = item as FoodItem;
      if (foodSprite.body instanceof Phaser.Physics.Arcade.Body) {
        foodSprite.body.enable = false;
      }
      this.tweens.add({
        targets: foodSprite,
        alpha: 0.3,
        duration: 500,
      });
    });
  }

  private restartGame() {
    console.log('Restarting game...');
    this.resetGame();
  }

  private spawnFood() {
    if (this.isGameOver) return;

    const foodType = Phaser.Math.RND.pick(this.foodTypes);
    const spawnX = Phaser.Math.Between(50, this.cameras.main.width - 50);
    const spawnY = this.cameras.main.height + 32;

    const food = new FoodItem(this, spawnX, spawnY, foodType, foodType);
    this.foodItemGroup.add(food);
    food.setInteractive();

    if (food.body instanceof Phaser.Physics.Arcade.Body) {
      food.body.setVelocityY(Phaser.Math.Between(-400, -600));
      food.body.setGravityY(300);
      food.body.setAngularVelocity(Phaser.Math.Between(-200, 200));
    }
    // food.setScale(32); // Removed as new assets should be appropriately sized
  }
}
