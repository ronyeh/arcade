export interface GameState {
    sequence: number[];
    playerSequence: number[];
    round: number;
    score: number;
    lives: number;
    isPlaying: boolean;
    isShowingSequence: boolean;
    currentSequenceIndex: number;
    gameStarted: boolean;
    gameOver: boolean;
}

export interface BonusState {
    isActive: boolean;
    type: BonusType | null;
    hintsRemaining: number;
    fiftyFiftyActive: boolean;
    hiddenSquares: number[];
}

export enum BonusType {
    EXTRA_LIFE = 'extraLife',
    HINT = 'hint',
    FIFTY_FIFTY = 'fiftyFifty'
}

export interface SquareConfig {
    x: number;
    y: number;
    color: number;
    darkColor: number;
    key: string;
    frequency: number;
}

export interface Position {
    x: number;
    y: number;
}
