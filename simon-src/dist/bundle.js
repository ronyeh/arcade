var SimonGame = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/Square.ts
  var Square = class {
    constructor(config, size) {
      __publicField(this, "container");
      __publicField(this, "graphics");
      __publicField(this, "isActive", false);
      __publicField(this, "isHidden", false);
      __publicField(this, "config");
      __publicField(this, "flashTween", null);
      this.config = config;
      this.container = new PIXI.Container();
      this.graphics = new PIXI.Graphics();
      this.container.addChild(this.graphics);
      this.container.x = config.x;
      this.container.y = config.y;
      this.container.interactive = true;
      this.container.buttonMode = true;
      this.drawSquare(size);
    }
    drawSquare(size) {
      this.graphics.clear();
      if (this.isHidden) {
        this.graphics.beginFill(0, 0.7);
        this.graphics.drawRoundedRect(-size / 2, -size / 2, size, size, 10);
        this.graphics.endFill();
      } else {
        const color = this.isActive ? this.config.color : this.config.darkColor;
        this.graphics.beginFill(color);
        this.graphics.drawRoundedRect(-size / 2, -size / 2, size, size, 10);
        this.graphics.endFill();
        this.graphics.lineStyle(3, 16777215, 0.8);
        this.graphics.drawRoundedRect(-size / 2, -size / 2, size, size, 10);
      }
    }
    flash(duration = 500) {
      return new Promise((resolve) => {
        this.isActive = true;
        this.drawSquare(150);
        setTimeout(() => {
          this.isActive = false;
          this.drawSquare(150);
          resolve();
        }, duration);
      });
    }
    setHidden(hidden) {
      this.isHidden = hidden;
      this.drawSquare(150);
    }
    onClick(callback) {
      this.container.on("pointerdown", callback);
    }
    setSize(size) {
      this.drawSquare(size);
    }
    get key() {
      return this.config.key;
    }
    get frequency() {
      return this.config.frequency;
    }
  };

  // src/AudioManager.ts
  var AudioManager = class {
    constructor() {
      __publicField(this, "synth");
      __publicField(this, "isInitialized", false);
      this.synth = new Tone.Synth().toDestination();
    }
    async initialize() {
      if (!this.isInitialized) {
        await Tone.start();
        this.isInitialized = true;
      }
    }
    playTone(frequency, duration = 0.3) {
      if (!this.isInitialized) {
        console.warn("AudioManager not initialized");
        return;
      }
      try {
        this.synth.triggerAttackRelease(frequency, duration);
      } catch (error) {
        console.error("Error playing tone:", error);
      }
    }
    playSequenceTone(frequency) {
      this.playTone(frequency, 0.5);
    }
    playSuccessTone() {
      const frequencies = [523.25, 659.25, 783.99];
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 0.2);
        }, index * 100);
      });
    }
    playFailTone() {
      const frequencies = [220, 196, 174.61];
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 0.3);
        }, index * 150);
      });
    }
    playBonusTone() {
      const frequencies = [261.63, 329.63, 392, 523.25];
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 0.15);
        }, index * 100);
      });
    }
  };

  // src/BonusManager.ts
  var BonusManager = class {
    constructor(onBonusActivated) {
      __publicField(this, "bonusState");
      __publicField(this, "onBonusActivated");
      this.bonusState = {
        isActive: false,
        type: null,
        hintsRemaining: 0,
        fiftyFiftyActive: false,
        hiddenSquares: []
      };
      this.onBonusActivated = onBonusActivated;
    }
    shouldShowBonus(round) {
      return round > 0 && round % 5 === 0;
    }
    activateBonus(type) {
      this.bonusState.type = type;
      this.bonusState.isActive = true;
      switch (type) {
        case "extraLife" /* EXTRA_LIFE */:
          break;
        case "hint" /* HINT */:
          this.bonusState.hintsRemaining = 3;
          break;
        case "fiftyFifty" /* FIFTY_FIFTY */:
          this.bonusState.fiftyFiftyActive = true;
          break;
      }
      this.onBonusActivated(type);
    }
    useHint() {
      if (this.bonusState.hintsRemaining > 0) {
        this.bonusState.hintsRemaining--;
        return true;
      }
      return false;
    }
    activateFiftyFifty(correctSquare) {
      if (!this.bonusState.fiftyFiftyActive) {
        return [];
      }
      const allSquares = [0, 1, 2, 3];
      const incorrectSquares = allSquares.filter((i) => i !== correctSquare);
      for (let i = incorrectSquares.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectSquares[i], incorrectSquares[j]] = [incorrectSquares[j], incorrectSquares[i]];
      }
      this.bonusState.hiddenSquares = incorrectSquares.slice(0, 2);
      this.bonusState.fiftyFiftyActive = false;
      return this.bonusState.hiddenSquares;
    }
    clearHiddenSquares() {
      this.bonusState.hiddenSquares = [];
    }
    reset() {
      this.bonusState = {
        isActive: false,
        type: null,
        hintsRemaining: 0,
        fiftyFiftyActive: false,
        hiddenSquares: []
      };
    }
    get state() {
      return __spreadValues({}, this.bonusState);
    }
    get hasHints() {
      return this.bonusState.hintsRemaining > 0;
    }
    get canUseFiftyFifty() {
      return this.bonusState.fiftyFiftyActive;
    }
  };

  // src/Game.ts
  var Game = class {
    constructor() {
      __publicField(this, "app");
      __publicField(this, "squares", []);
      __publicField(this, "gameState");
      __publicField(this, "audioManager");
      __publicField(this, "bonusManager");
      __publicField(this, "squareConfigs", [
        { x: 150, y: 150, color: 16729156, darkColor: 8917265, key: "f", frequency: 261.63 },
        // C4 - Red (top-left)
        { x: 150, y: 350, color: 4521796, darkColor: 1148945, key: "d", frequency: 329.63 },
        // E4 - Green (bottom-left)
        { x: 350, y: 150, color: 4474111, darkColor: 1118600, key: "j", frequency: 392 },
        // G4 - Blue (top-right)
        { x: 350, y: 350, color: 16777028, darkColor: 8947729, key: "k", frequency: 523.25 }
        // C5 - Yellow (bottom-right)
      ]);
      this.gameState = {
        sequence: [],
        playerSequence: [],
        round: 0,
        score: 0,
        lives: 3,
        isPlaying: false,
        isShowingSequence: false,
        currentSequenceIndex: 0,
        gameStarted: false,
        gameOver: false
      };
      this.audioManager = new AudioManager();
      this.bonusManager = new BonusManager((type) => this.handleBonusActivation(type));
      this.setupEventListeners();
    }
    async initializeGame() {
      var _a, _b;
      try {
        this.app = new PIXI.Application({
          width: 500,
          height: 500,
          backgroundColor: 1710638,
          antialias: true
        });
        await ((_b = (_a = this.app).init) == null ? void 0 : _b.call(_a)) || Promise.resolve();
        const canvas = document.getElementById("game-canvas");
        if (canvas && canvas.parentNode) {
          canvas.parentNode.replaceChild(this.app.view, canvas);
        }
        await this.audioManager.initialize();
        this.createSquares();
        this.updateUI();
      } catch (error) {
        console.error("Failed to initialize game:", error);
        throw error;
      }
    }
    createSquares() {
      this.squareConfigs.forEach((config, index) => {
        const square = new Square(config, 150);
        square.onClick(() => this.handleSquareClick(index));
        this.squares.push(square);
        this.app.stage.addChild(square.container);
      });
    }
    setupEventListeners() {
      var _a, _b, _c, _d, _e;
      document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        const squareIndex = this.squareConfigs.findIndex((config) => config.key === key);
        if (squareIndex !== -1 && this.gameState.isPlaying && !this.gameState.isShowingSequence) {
          this.handleSquareClick(squareIndex);
        }
      });
      (_a = document.getElementById("start-btn")) == null ? void 0 : _a.addEventListener("click", () => this.startGame());
      (_b = document.getElementById("restart-btn")) == null ? void 0 : _b.addEventListener("click", () => this.restartGame());
      (_c = document.getElementById("bonus-life")) == null ? void 0 : _c.addEventListener("click", () => this.selectBonus("extraLife" /* EXTRA_LIFE */));
      (_d = document.getElementById("bonus-hint")) == null ? void 0 : _d.addEventListener("click", () => this.selectBonus("hint" /* HINT */));
      (_e = document.getElementById("bonus-fifty")) == null ? void 0 : _e.addEventListener("click", () => this.selectBonus("fiftyFifty" /* FIFTY_FIFTY */));
    }
    handleSquareClick(index) {
      if (!this.gameState.isPlaying || this.gameState.isShowingSequence) {
        return;
      }
      if (this.bonusManager.state.hiddenSquares.includes(index)) {
        return;
      }
      const square = this.squares[index];
      square.flash(200);
      this.audioManager.playTone(square.frequency, 0.2);
      this.gameState.playerSequence.push(index);
      const currentIndex = this.gameState.playerSequence.length - 1;
      const expectedSquare = this.gameState.sequence[currentIndex];
      if (index !== expectedSquare) {
        this.handleIncorrectInput();
        return;
      }
      if (this.gameState.playerSequence.length === this.gameState.sequence.length) {
        this.handleSequenceComplete();
      }
    }
    handleIncorrectInput() {
      this.audioManager.playFailTone();
      this.gameState.lives--;
      if (this.gameState.lives <= 0) {
        this.endGame();
      } else {
        this.gameState.playerSequence = [];
        setTimeout(() => {
          this.showSequence();
        }, 1e3);
      }
      this.updateUI();
    }
    handleSequenceComplete() {
      this.audioManager.playSuccessTone();
      this.gameState.score += this.gameState.round * 10;
      this.gameState.round++;
      this.bonusManager.clearHiddenSquares();
      this.squares.forEach((square) => square.setHidden(false));
      if (this.bonusManager.shouldShowBonus(this.gameState.round)) {
        this.showBonusPanel();
      } else {
        this.nextRound();
      }
      this.updateUI();
    }
    nextRound() {
      const newSquare = Math.floor(Math.random() * 4);
      this.gameState.sequence.push(newSquare);
      this.gameState.playerSequence = [];
      setTimeout(() => {
        this.showSequence();
      }, 1e3);
    }
    async showSequence() {
      this.gameState.isShowingSequence = true;
      for (let i = 0; i < this.gameState.sequence.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const squareIndex = this.gameState.sequence[i];
        const square = this.squares[squareIndex];
        square.flash(500);
        this.audioManager.playSequenceTone(square.frequency);
      }
      setTimeout(() => {
        this.gameState.isShowingSequence = false;
      }, 1e3);
    }
    showBonusPanel() {
      var _a;
      (_a = document.getElementById("bonus-panel")) == null ? void 0 : _a.classList.remove("hidden");
      this.audioManager.playBonusTone();
    }
    selectBonus(type) {
      var _a;
      this.bonusManager.activateBonus(type);
      (_a = document.getElementById("bonus-panel")) == null ? void 0 : _a.classList.add("hidden");
      this.nextRound();
    }
    handleBonusActivation(type) {
      switch (type) {
        case "extraLife" /* EXTRA_LIFE */:
          this.gameState.lives++;
          break;
        case "hint" /* HINT */:
          break;
        case "fiftyFifty" /* FIFTY_FIFTY */:
          break;
      }
      this.updateUI();
    }
    useHint() {
      if (this.bonusManager.hasHints && this.gameState.playerSequence.length < this.gameState.sequence.length) {
        const nextSquareIndex = this.gameState.sequence[this.gameState.playerSequence.length];
        const square = this.squares[nextSquareIndex];
        if (this.bonusManager.useHint()) {
          this.audioManager.playTone(square.frequency, 0.5);
        }
      }
    }
    useFiftyFifty() {
      if (this.bonusManager.canUseFiftyFifty && this.gameState.playerSequence.length < this.gameState.sequence.length) {
        const nextSquareIndex = this.gameState.sequence[this.gameState.playerSequence.length];
        const hiddenSquares = this.bonusManager.activateFiftyFifty(nextSquareIndex);
        hiddenSquares.forEach((index) => {
          this.squares[index].setHidden(true);
        });
      }
    }
    startGame() {
      var _a;
      this.gameState.gameStarted = true;
      this.gameState.isPlaying = true;
      this.gameState.sequence = [];
      (_a = document.getElementById("instructions")) == null ? void 0 : _a.classList.add("hidden");
      this.nextRound();
    }
    restartGame() {
      var _a, _b, _c;
      this.gameState = {
        sequence: [],
        playerSequence: [],
        round: 0,
        score: 0,
        lives: 3,
        isPlaying: false,
        isShowingSequence: false,
        currentSequenceIndex: 0,
        gameStarted: false,
        gameOver: false
      };
      this.bonusManager.reset();
      (_a = document.getElementById("game-over")) == null ? void 0 : _a.classList.add("hidden");
      (_b = document.getElementById("instructions")) == null ? void 0 : _b.classList.remove("hidden");
      (_c = document.getElementById("bonus-panel")) == null ? void 0 : _c.classList.add("hidden");
      this.squares.forEach((square) => square.setHidden(false));
      this.updateUI();
    }
    endGame() {
      var _a;
      this.gameState.gameOver = true;
      this.gameState.isPlaying = false;
      (_a = document.getElementById("game-over")) == null ? void 0 : _a.classList.remove("hidden");
      const finalScore = document.getElementById("final-score");
      const finalRound = document.getElementById("final-round");
      if (finalScore) finalScore.textContent = this.gameState.score.toString();
      if (finalRound) finalRound.textContent = this.gameState.round.toString();
    }
    updateUI() {
      const roundElement = document.getElementById("round");
      const livesElement = document.getElementById("lives");
      const scoreElement = document.getElementById("score");
      if (roundElement) roundElement.textContent = this.gameState.round.toString();
      if (livesElement) livesElement.textContent = this.gameState.lives.toString();
      if (scoreElement) scoreElement.textContent = this.gameState.score.toString();
    }
    getApp() {
      return this.app;
    }
  };

  // src/main.ts
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const game = new Game();
      await game.initializeGame();
      window.game = game;
      console.log("Simon Says game initialized!");
      document.addEventListener("keydown", (event) => {
        if (event.key === "h" || event.key === "H") {
          game.useHint();
        }
        if (event.key === "x" || event.key === "X") {
          game.useFiftyFifty();
        }
      });
    } catch (error) {
      console.error("Failed to initialize game:", error);
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>Error Loading Game</h2>
                    <p>There was an error initializing the Simon Says game.</p>
                    <p>Please refresh the page and try again.</p>
                    <button onclick="location.reload()" style="
                        background: #4ecdc4;
                        border: none;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-size: 1.1rem;
                        cursor: pointer;
                    ">Refresh Page</button>
                </div>
            `;
      }
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (window.Tone && window.Tone.context.state === "suspended") {
        window.Tone.start();
      }
    }
  });
})();
//# sourceMappingURL=bundle.js.map
