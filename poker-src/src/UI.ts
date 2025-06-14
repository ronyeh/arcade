import { GameState, BettingRound } from './GameState';
import { Player } from './Player';

export class UIManager {
    private foldButton: HTMLButtonElement;
    private checkButton: HTMLButtonElement;
    private callButton: HTMLButtonElement;
    private betButton: HTMLButtonElement;
    private raiseButton: HTMLButtonElement;
    private betAmountInput: HTMLInputElement;
    private playerTurnIndicator: HTMLParagraphElement;
    private networkControlsDiv: HTMLElement;
    private actionControlsDiv: HTMLElement;


    constructor() {
        this.foldButton = document.getElementById('foldButton') as HTMLButtonElement;
        this.checkButton = document.getElementById('checkButton') as HTMLButtonElement;
        this.callButton = document.getElementById('callButton') as HTMLButtonElement;
        this.betButton = document.getElementById('betButton') as HTMLButtonElement;
        this.raiseButton = document.getElementById('raiseButton') as HTMLButtonElement;
        this.betAmountInput = document.getElementById('betAmountInput') as HTMLInputElement;
        this.playerTurnIndicator = document.getElementById('playerTurnIndicator') as HTMLParagraphElement;
        this.networkControlsDiv = document.getElementById('network-controls') as HTMLElement;
        this.actionControlsDiv = document.getElementById('action-controls') as HTMLElement;


        if (!this.foldButton || !this.checkButton || !this.callButton || !this.betButton || !this.raiseButton || !this.betAmountInput || !this.playerTurnIndicator || !this.networkControlsDiv || !this.actionControlsDiv) {
            throw new Error("One or more UI elements for game actions not found in the DOM.");
        }

        this.hideActionControls(); // Hidden by default until game starts and it's player's turn
    }

    public toggleNetworkControls(show: boolean): void {
        if (this.networkControlsDiv) {
            this.networkControlsDiv.style.display = show ? 'block' : 'none';
        }
    }

    public showActionControls(): void {
        this.actionControlsDiv.classList.remove('hidden');
         this.actionControlsDiv.style.display = 'flex'; // Or whatever its default display is
    }

    public hideActionControls(): void {
        //this.actionControlsDiv.classList.add('hidden');
        this.actionControlsDiv.style.display = 'none';
    }


    public updateActionButtons(gameState: GameState, localPlayerId: string | null): void {
        if (!localPlayerId || gameState.bettingRound === BettingRound.GameOver || gameState.bettingRound === BettingRound.Showdown) {
            this.disableAllActions("Game over or not playing.");
            this.hideActionControls(); // Hide controls if game is over or player not part of it
            return;
        }

        this.showActionControls(); // Make sure they are visible if it's an active game

        const currentPlayer = gameState.activePlayers[gameState.currentPlayerIndex];
        const isLocalPlayerTurn = currentPlayer && currentPlayer.id === localPlayerId && !currentPlayer.folded && !currentPlayer.isAllIn;

        if (!isLocalPlayerTurn) {
            this.disableAllActions(currentPlayer ? `${currentPlayer.name}'s turn` : "Waiting for player...");
            return;
        }

        this.playerTurnIndicator.textContent = "Your Turn";

        // Enable all buttons by default, then disable based on rules
        this.foldButton.disabled = false;
        this.checkButton.disabled = false;
        this.callButton.disabled = false;
        this.betButton.disabled = false;
        this.raiseButton.disabled = false;
        this.betAmountInput.disabled = false;

        const currentBetForPlayer = currentPlayer.currentBet; // How much player has bet this round
        const gameCurrentRoundBet = gameState.currentRoundBet; // Highest bet on table this round

        // Fold is always possible if it's your turn
        this.foldButton.disabled = false;

        // Check: Possible if currentRoundBet is 0 OR player's currentBet matches currentRoundBet
        if (gameCurrentRoundBet > 0 && currentBetForPlayer < gameCurrentRoundBet) {
            this.checkButton.disabled = true; // Must call or raise
        } else {
            this.checkButton.disabled = false; // Can check
        }

        // Call: Possible if there's a bet to call (gameCurrentRoundBet > currentBetForPlayer)
        // And player has enough chips (implicit, button click will handle if not enough)
        if (gameCurrentRoundBet > 0 && currentBetForPlayer < gameCurrentRoundBet) {
            this.callButton.disabled = false;
            this.callButton.textContent = `Call ${gameCurrentRoundBet - currentBetForPlayer}`;
        } else {
            this.callButton.disabled = true;
            this.callButton.textContent = "Call";
        }

        // Bet: Possible if no bet has been made yet in this round (gameCurrentRoundBet === 0)
        if (gameCurrentRoundBet === 0) {
            this.betButton.disabled = false;
            this.raiseButton.disabled = true; // Cannot raise if no bet yet
            this.callButton.disabled = true; // Cannot call if no bet yet (check is the option)
        } else {
            // There is an existing bet
            this.betButton.disabled = true; // Must call or raise
            this.raiseButton.disabled = false; // Can raise
        }

        // Ensure player has chips to make any bet/raise/call
        if (currentPlayer.chips === 0) { // All-in
            this.disableAllActions("You are All-In.");
            this.foldButton.disabled = true; // Cannot fold if all-in and no further action possible
        }

        // Input field validation (basic) - min bet/raise is usually big blind or last bet/raise amount
        this.betAmountInput.min = gameState.minRaise.toString();
        // Placeholder could be the min raise amount
        this.betAmountInput.placeholder = `Min ${gameState.minRaise}`;


    }

    private disableAllActions(reason: string): void {
        this.foldButton.disabled = true;
        this.checkButton.disabled = true;
        this.callButton.disabled = true;
        this.betButton.disabled = true;
        this.raiseButton.disabled = true;
        this.betAmountInput.disabled = true;
        this.playerTurnIndicator.textContent = reason;
    }

    public getBetAmount(): number {
        const amount = parseInt(this.betAmountInput.value, 10);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid bet amount.");
            return 0;
        }
        return amount;
    }

    public clearBetAmount(): void {
        this.betAmountInput.value = "";
    }
}
