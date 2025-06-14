import { BonusState, BonusType } from './types';

export class BonusManager {
    private bonusState: BonusState;
    private onBonusActivated: (type: BonusType) => void;

    constructor(onBonusActivated: (type: BonusType) => void) {
        this.bonusState = {
            isActive: false,
            type: null,
            hintsRemaining: 0,
            fiftyFiftyActive: false,
            hiddenSquares: []
        };
        this.onBonusActivated = onBonusActivated;
    }

    public shouldShowBonus(round: number): boolean {
        return round > 0 && round % 5 === 0;
    }

    public activateBonus(type: BonusType): void {
        this.bonusState.type = type;
        this.bonusState.isActive = true;

        switch (type) {
            case BonusType.EXTRA_LIFE:
                // Extra life will be handled by the game
                break;
            case BonusType.HINT:
                this.bonusState.hintsRemaining = 3;
                break;
            case BonusType.FIFTY_FIFTY:
                this.bonusState.fiftyFiftyActive = true;
                break;
        }

        this.onBonusActivated(type);
    }

    public useHint(): boolean {
        if (this.bonusState.hintsRemaining > 0) {
            this.bonusState.hintsRemaining--;
            return true;
        }
        return false;
    }

    public activateFiftyFifty(correctSquare: number): number[] {
        if (!this.bonusState.fiftyFiftyActive) {
            return [];
        }

        // Hide 2 random squares that are not the correct one
        const allSquares = [0, 1, 2, 3];
        const incorrectSquares = allSquares.filter(i => i !== correctSquare);
        
        // Shuffle and take 2
        for (let i = incorrectSquares.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [incorrectSquares[i], incorrectSquares[j]] = [incorrectSquares[j], incorrectSquares[i]];
        }
        
        this.bonusState.hiddenSquares = incorrectSquares.slice(0, 2);
        this.bonusState.fiftyFiftyActive = false; // One time use
        
        return this.bonusState.hiddenSquares;
    }

    public clearHiddenSquares(): void {
        this.bonusState.hiddenSquares = [];
    }

    public reset(): void {
        this.bonusState = {
            isActive: false,
            type: null,
            hintsRemaining: 0,
            fiftyFiftyActive: false,
            hiddenSquares: []
        };
    }

    public get state(): BonusState {
        return { ...this.bonusState };
    }

    public get hasHints(): boolean {
        return this.bonusState.hintsRemaining > 0;
    }

    public get canUseFiftyFifty(): boolean {
        return this.bonusState.fiftyFiftyActive;
    }
}
