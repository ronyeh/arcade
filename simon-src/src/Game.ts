import { GameState, SquareConfig, BonusType } from './types';
import { Square } from './Square';
import { AudioManager } from './AudioManager';
import { BonusManager } from './BonusManager';

// Use any type for CDN-loaded PIXI
declare const PIXI: any;

export class Game {
    private app: any;
    private squares: Square[] = [];
    private gameState: GameState;
    private audioManager: AudioManager;
    private bonusManager: BonusManager;
    
    private squareConfigs: SquareConfig[] = [
        { x: 150, y: 150, color: 0xFF4444, darkColor: 0x881111, key: 'f', frequency: 261.63 }, // C4 - Red (top-left)
        { x: 150, y: 350, color: 0x44FF44, darkColor: 0x118811, key: 'd', frequency: 329.63 }, // E4 - Green (bottom-left)
        { x: 350, y: 150, color: 0x4444FF, darkColor: 0x111188, key: 'j', frequency: 392.00 }, // G4 - Blue (top-right)
        { x: 350, y: 350, color: 0xFFFF44, darkColor: 0x888811, key: 'k', frequency: 523.25 }  // C5 - Yellow (bottom-right)
    ];

    constructor() {
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
        this.bonusManager = new BonusManager((type: BonusType) => this.handleBonusActivation(type));

        this.setupEventListeners();
    }

    public async initializeGame(): Promise<void> {
        try {
            // Create PIXI Application
            this.app = new PIXI.Application({
                width: 500,
                height: 500,
                backgroundColor: 0x1a1a2e,
                antialias: true
            });

            // Wait for PIXI to be ready
            await this.app.init?.() || Promise.resolve();

            // Mount the PIXI app to the canvas
            const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.replaceChild(this.app.view as HTMLCanvasElement, canvas);
            }

            // Initialize audio
            await this.audioManager.initialize();

            // Create squares
            this.createSquares();
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }

    private createSquares(): void {
        this.squareConfigs.forEach((config, index) => {
            const square = new Square(config, 150);
            square.onClick(() => this.handleSquareClick(index));
            this.squares.push(square);
            this.app.stage.addChild(square.container);
        });
    }

    private setupEventListeners(): void {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            const squareIndex = this.squareConfigs.findIndex(config => config.key === key);
            
            if (squareIndex !== -1 && this.gameState.isPlaying && !this.gameState.isShowingSequence) {
                this.handleSquareClick(squareIndex);
            }
        });

        // UI button listeners
        document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());
        
        // Bonus button listeners
        document.getElementById('bonus-life')?.addEventListener('click', () => this.selectBonus(BonusType.EXTRA_LIFE));
        document.getElementById('bonus-hint')?.addEventListener('click', () => this.selectBonus(BonusType.HINT));
        document.getElementById('bonus-fifty')?.addEventListener('click', () => this.selectBonus(BonusType.FIFTY_FIFTY));
    }

    private handleSquareClick(index: number): void {
        if (!this.gameState.isPlaying || this.gameState.isShowingSequence) {
            return;
        }

        // Check if square is hidden by 50/50 bonus
        if (this.bonusManager.state.hiddenSquares.includes(index)) {
            return;
        }

        const square = this.squares[index];
        
        // Visual and audio feedback
        square.flash(200);
        this.audioManager.playTone(square.frequency, 0.2);

        // Add to player sequence
        this.gameState.playerSequence.push(index);

        // Check if current input is correct
        const currentIndex = this.gameState.playerSequence.length - 1;
        const expectedSquare = this.gameState.sequence[currentIndex];

        if (index !== expectedSquare) {
            this.handleIncorrectInput();
            return;
        }

        // Check if sequence is complete
        if (this.gameState.playerSequence.length === this.gameState.sequence.length) {
            this.handleSequenceComplete();
        }
    }

    private handleIncorrectInput(): void {
        this.audioManager.playFailTone();
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
            this.endGame();
        } else {
            // Reset for retry
            this.gameState.playerSequence = [];
            setTimeout(() => {
                this.showSequence();
            }, 1000);
        }
        
        this.updateUI();
    }

    private handleSequenceComplete(): void {
        this.audioManager.playSuccessTone();
        this.gameState.score += this.gameState.round * 10;
        this.gameState.round++;
        
        // Clear any 50/50 hidden squares
        this.bonusManager.clearHiddenSquares();
        this.squares.forEach(square => square.setHidden(false));
        
        // Check for bonus round
        if (this.bonusManager.shouldShowBonus(this.gameState.round)) {
            this.showBonusPanel();
        } else {
            this.nextRound();
        }
        
        this.updateUI();
    }

    private nextRound(): void {
        // Add new random square to sequence
        const newSquare = Math.floor(Math.random() * 4);
        this.gameState.sequence.push(newSquare);
        this.gameState.playerSequence = [];
        
        setTimeout(() => {
            this.showSequence();
        }, 1000);
    }

    private async showSequence(): Promise<void> {
        this.gameState.isShowingSequence = true;
        
        for (let i = 0; i < this.gameState.sequence.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            
            const squareIndex = this.gameState.sequence[i];
            const square = this.squares[squareIndex];
            
            // Flash square and play tone
            square.flash(500);
            this.audioManager.playSequenceTone(square.frequency);
        }
        
        // Wait a bit before allowing input
        setTimeout(() => {
            this.gameState.isShowingSequence = false;
        }, 1000);
    }

    private showBonusPanel(): void {
        document.getElementById('bonus-panel')?.classList.remove('hidden');
        this.audioManager.playBonusTone();
    }

    private selectBonus(type: BonusType): void {
        this.bonusManager.activateBonus(type);
        document.getElementById('bonus-panel')?.classList.add('hidden');
        this.nextRound();
    }

    private handleBonusActivation(type: BonusType): void {
        switch (type) {
            case BonusType.EXTRA_LIFE:
                this.gameState.lives++;
                break;
            case BonusType.HINT:
                // Hint functionality will be available during gameplay
                break;
            case BonusType.FIFTY_FIFTY:
                // 50/50 will be activated when needed
                break;
        }
        this.updateUI();
    }

    public useHint(): void {
        if (this.bonusManager.hasHints && this.gameState.playerSequence.length < this.gameState.sequence.length) {
            const nextSquareIndex = this.gameState.sequence[this.gameState.playerSequence.length];
            const square = this.squares[nextSquareIndex];
            
            if (this.bonusManager.useHint()) {
                // Play tone without visual flash
                this.audioManager.playTone(square.frequency, 0.5);
            }
        }
    }

    public useFiftyFifty(): void {
        if (this.bonusManager.canUseFiftyFifty && this.gameState.playerSequence.length < this.gameState.sequence.length) {
            const nextSquareIndex = this.gameState.sequence[this.gameState.playerSequence.length];
            const hiddenSquares = this.bonusManager.activateFiftyFifty(nextSquareIndex);
            
            // Hide the incorrect squares
            hiddenSquares.forEach(index => {
                this.squares[index].setHidden(true);
            });
        }
    }

    private startGame(): void {
        this.gameState.gameStarted = true;
        this.gameState.isPlaying = true;
        this.gameState.sequence = [];
        
        document.getElementById('instructions')?.classList.add('hidden');
        
        this.nextRound();
    }

    private restartGame(): void {
        // Reset game state
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
        
        // Reset UI
        document.getElementById('game-over')?.classList.add('hidden');
        document.getElementById('instructions')?.classList.remove('hidden');
        document.getElementById('bonus-panel')?.classList.add('hidden');
        
        // Reset squares
        this.squares.forEach(square => square.setHidden(false));
        
        this.updateUI();
    }

    private endGame(): void {
        this.gameState.gameOver = true;
        this.gameState.isPlaying = false;
        
        // Show game over screen
        document.getElementById('game-over')?.classList.remove('hidden');
        const finalScore = document.getElementById('final-score');
        const finalRound = document.getElementById('final-round');
        
        if (finalScore) finalScore.textContent = this.gameState.score.toString();
        if (finalRound) finalRound.textContent = this.gameState.round.toString();
    }

    private updateUI(): void {
        const roundElement = document.getElementById('round');
        const livesElement = document.getElementById('lives');
        const scoreElement = document.getElementById('score');
        
        if (roundElement) roundElement.textContent = this.gameState.round.toString();
        if (livesElement) livesElement.textContent = this.gameState.lives.toString();
        if (scoreElement) scoreElement.textContent = this.gameState.score.toString();
    }

    public getApp(): any {
        return this.app;
    }
}
