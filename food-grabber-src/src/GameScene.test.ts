import { GameScene } from './GameScene';
import { FoodItem } from './FoodItem'; // Will be mocked
import Phaser from 'phaser';

// Mock Phaser Math functions if they are not available in test env
if (!Phaser.Math) {
  (Phaser as any).Math = {};
}
if (!Phaser.Math.RND) {
  (Phaser.Math as any).RND = {};
}
Phaser.Math.RND.pick = jest.fn(array => array[0]); // Default mock: always pick the first item
Phaser.Math.Between = jest.fn((min, max) => min); // Default mock: always return min


// Mock Phaser parts and FoodItem
jest.mock('./FoodItem', () => {
  return {
    FoodItem: jest.fn().mockImplementation((scene, x, y, texture, type) => {
      return {
        x: x,
        y: y,
        textureKey: texture, // Changed from 'texture' to 'textureKey' to avoid conflict with Phaser.GameObjects.Sprite.texture
        type: type,
        height: 32, // Default mock height
        active: true,
        destroy: jest.fn(),
        setInteractive: jest.fn().mockReturnThis(), // Add mock for setInteractive
        // Mock any other methods/properties FoodItem might have if needed by GameScene.update
        // Add 'body' property for physics checks if spawnFood uses it before setVelocityY etc.
        body: { 
          setVelocityY: jest.fn(),
          setGravityY: jest.fn(),
          setAngularVelocity: jest.fn(),
          enable: true, // Mock 'enable' property for triggerGameOver
        }
      };
    })
  };
});

// Mock Phaser's global stuff if not using a comprehensive mock library
// For GameScene, we need to mock scene-specific things like cameras, time, physics, add, input
// This can be done by passing a mocked scene object to the GameScene constructor

describe('GameScene', () => {
  let scene: GameScene;
  let mockSceneConfig: any;

  beforeEach(() => {
    // Prepare a mock scene object that GameScene constructor expects
    // and that its methods (preload, create, update) might interact with.
    mockSceneConfig = {
      sys: {
        game: {
          config: {},
        },
        settings: {
          key: 'GameScene',
        },
        textures: {
          exists: jest.fn().mockReturnValue(true), // Assume textures exist
          get: jest.fn().mockReturnValue({}), // Return a dummy texture object
        },
        events: {
          on: jest.fn(),
          off: jest.fn(),
        },
        loader: { // Mock for this.load
          image: jest.fn(),
          // Add other loader methods if scene.preload uses them (e.g., setPath, audio, etc.)
        }
      },
      cameras: {
        main: {
          width: 800,
          height: 600,
          centerY: 300, // Example value
          centerX: 400, // Example value
        }
      },
      add: { // Mock 'add' group and 'text'
        group: jest.fn().mockReturnValue({
          clear: jest.fn(), // Mock clear method for resetGame
          add: jest.fn(),    // Mock add method for spawnFood
          getChildren: jest.fn().mockReturnValue([]), // Default to no children
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setPadding: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(), // Mock setText for selectNewTargetFood
          setDepth: jest.fn().mockReturnThis(),
        }),
      },
      physics: { // Mock 'physics'
        add: {
          group: jest.fn().mockReturnValue({
            clear: jest.fn(),
            add: jest.fn(),
            getChildren: jest.fn().mockReturnValue([]),
          }),
        }
      },
      input: { // Mock 'input'
        on: jest.fn(),
      },
      time: { // Mock 'time'
        addEvent: jest.fn().mockReturnValue({
          paused: false,
          remove: jest.fn(), // Mock remove method for resetGame
        }),
      },
      load: { // Actually assign to scene.load, not scene.sys.loader
        image: jest.fn(),
        // setPath, audio, etc. if needed
      },
      tweens: { // Mock for this.tweens
        add: jest.fn().mockReturnValue({
          // Mock tween methods if needed, like play, stop, etc.
          // For now, just adding it is enough as per the error.
        }),
      }
      // Mock any other scene properties GameScene uses
    };

    // Instantiate GameScene with the mocked scene config
    // Phaser scenes are typically not instantiated with `new` by users, but by the game.
    // However, for unit testing, we can do this if we provide the necessary sys properties.
    scene = new GameScene();
    // Assign mocked properties to the scene instance
    // Make sure to assign to `scene.sys` for system properties and directly to `scene` for others like `load`
    Object.assign(scene.sys, mockSceneConfig.sys);
    scene.cameras = mockSceneConfig.cameras;
    scene.add = mockSceneConfig.add;
    scene.physics = mockSceneConfig.physics;
    scene.input = mockSceneConfig.input; // Typo fixed here
    scene.time = mockSceneConfig.time;
    scene.load = mockSceneConfig.load;
    scene.tweens = mockSceneConfig.tweens;


    // Manually call create as Phaser's lifecycle isn't running
    // We need to ensure scene.create() is called to initialize foodItemGroup, etc.
    // but we need to mock things that scene.create() uses, like `this.load` if it was used there.
    // For now, assuming `preload` is mostly for assets.
    // `create()` initializes `foodItemGroup`, `targetFoodText`, `gameOverText` etc.

    // Call preload and create manually
    scene.preload(); 
    scene.create();

    // Spy on triggerGameOver after it's been initialized in create()
    // Use `as any` to spy on private method
    jest.spyOn(scene as any, 'triggerGameOver');
    // Ensure foodItemGroup.getChildren is available for update()
    // Use `as any` to access private member
    (scene as any).foodItemGroup.getChildren = jest.fn().mockReturnValue([]); // This should be fine after scene.create()
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update method: missed food items', () => {
    test('should call triggerGameOver if a target food item is missed', () => {
      // Arrange
      (scene as any).isGameOver = false; // Ensure game is not already over
      (scene as any).currentTargetType = 'apple';
      const mockMissedTargetItem = new (FoodItem as any)(scene, 100, scene.cameras.main.height + 50, 'apple', 'apple');
      mockMissedTargetItem.active = true;
      mockMissedTargetItem.y = scene.cameras.main.height + mockMissedTargetItem.height + 1; // Fell off screen

      (scene as any).foodItemGroup.getChildren.mockReturnValue([mockMissedTargetItem]);
      
      // Act
      scene.update();

      // Assert
      expect((scene as any).triggerGameOver).toHaveBeenCalledWith(mockMissedTargetItem);
      expect(mockMissedTargetItem.destroy).toHaveBeenCalled();
    });

    test('should NOT call triggerGameOver if a non-target food item is missed', () => {
      // Arrange
      (scene as any).isGameOver = false;
      (scene as any).currentTargetType = 'apple'; // Target is apple
      const mockMissedNonTargetItem = new (FoodItem as any)(scene, 100, 0, 'sushi', 'sushi'); // Missed item is sushi
      mockMissedNonTargetItem.active = true;
      mockMissedNonTargetItem.y = scene.cameras.main.height + mockMissedNonTargetItem.height + 1; // Fell off screen
      
      (scene as any).foodItemGroup.getChildren.mockReturnValue([mockMissedNonTargetItem]);

      // Act
      scene.update();

      // Assert
      expect((scene as any).triggerGameOver).not.toHaveBeenCalled();
      expect(mockMissedNonTargetItem.destroy).toHaveBeenCalled(); // It should still be destroyed
    });

    test('should NOT call triggerGameOver if a target food item is missed but game is already over', () => {
      // Arrange
      (scene as any).isGameOver = true; // Game is already over
      (scene as any).currentTargetType = 'apple';
      const mockMissedTargetItem = new (FoodItem as any)(scene, 100, 0, 'apple', 'apple');
      mockMissedTargetItem.active = true;
      mockMissedTargetItem.y = scene.cameras.main.height + mockMissedTargetItem.height + 1;

      (scene as any).foodItemGroup.getChildren.mockReturnValue([mockMissedTargetItem]);
      
      // Act
      scene.update();

      // Assert
      expect((scene as any).triggerGameOver).not.toHaveBeenCalled();
      // In game over state, update should return early, so destroy might not be called by this path
      // Depending on exact implementation, items might be handled differently when game is over.
      // The current GameScene.update returns immediately if isGameOver is true.
      expect(mockMissedTargetItem.destroy).not.toHaveBeenCalled(); 
    });

    test('should NOT call triggerGameOver if a target food item is missed but is not active', () => {
      // Arrange
      (scene as any).isGameOver = false;
      (scene as any).currentTargetType = 'apple';
      const mockMissedTargetItem = new (FoodItem as any)(scene, 100, 0, 'apple', 'apple');
      mockMissedTargetItem.active = false; // Item is not active
      mockMissedTargetItem.y = scene.cameras.main.height + mockMissedTargetItem.height + 1;
      
      (scene as any).foodItemGroup.getChildren.mockReturnValue([mockMissedTargetItem]);
      
      // Act
      scene.update();

      // Assert
      expect((scene as any).triggerGameOver).not.toHaveBeenCalled();
      expect(mockMissedTargetItem.destroy).not.toHaveBeenCalled(); // Destroy is only called on active items
    });
  });
});
