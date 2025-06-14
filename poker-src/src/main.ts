import { GameState, BettingRound } from './GameState';
import { SVGGraphics } from './SVGGraphics';
import { Network, GameMessage } from './Network';
import { UIManager } from './UI'; // Import UIManager
import { SignalData } from 'simple-peer';
// Player and Card might not be directly needed if GameState handles all interactions
// import { Player } from './Player';
// import { Card } from './Card';

console.log("Poker Game - UI Interaction Test");

document.addEventListener('DOMContentLoaded', () => {
    let graphics: SVGGraphics;
    let network: Network;
    let gameState: GameState | undefined; // Can be undefined until game starts
    let uiManager: UIManager;
    let localPlayerId: string | null = null; // Determined after connection
    let isInitiatorFlag: boolean = false;

    // UI Elements for Networking (now mostly managed by UIManager)
    const initiateGameButton = document.getElementById('initiateGame') as HTMLButtonElement;
    const outgoingSignalTextarea = document.getElementById('outgoingSignal') as HTMLTextAreaElement;
    const incomingSignalTextarea = document.getElementById('incomingSignal') as HTMLTextAreaElement;
    const connectToSignalButton = document.getElementById('connectToSignal') as HTMLButtonElement;
    const connectionStatusP = document.getElementById('connectionStatus') as HTMLParagraphElement;

    // Action Control Elements (references needed for event listeners)
    const foldButton = document.getElementById('foldButton') as HTMLButtonElement;
    const checkButton = document.getElementById('checkButton') as HTMLButtonElement;
    const callButton = document.getElementById('callButton') as HTMLButtonElement;
    const betButton = document.getElementById('betButton') as HTMLButtonElement;
    const raiseButton = document.getElementById('raiseButton') as HTMLButtonElement;
    const betAmountInput = document.getElementById('betAmountInput') as HTMLInputElement;


    try {
        graphics = new SVGGraphics("game-container");
        uiManager = new UIManager(); // Initialize UI Manager
    } catch (e: any) {
        console.error("Failed to initialize Graphics or UI:", e);
        alert(`Error initializing: ${e.message}. Check console.`);
        return;
    }

    // --- Network Callbacks ---
    function handleSignal(signal: SignalData) {
        outgoingSignalTextarea.value = JSON.stringify(signal);
        connectionStatusP.textContent = "Signal generated. Share with peer.";
    }

    function handleConnect() {
        localPlayerId = isInitiatorFlag ? "p0" : "p1"; // Initiator is p0, joiner is p1
        connectionStatusP.textContent = `Connected! You are ${localPlayerId} ${isInitiatorFlag ? "(Initiator)" : "(Joined)"}`;
        console.log(`Network connected. Local player ID: ${localPlayerId}`);

        uiManager.toggleNetworkControls(false); // Hide network controls
        uiManager.showActionControls(); // Show game action controls

        if (isInitiatorFlag) {
            const playerNames = ["Player 0", "Player 1"]; // More generic names
            gameState = new GameState(playerNames, 1000, 5, 10);
            gameState.setupNewHand();
            gameState.dealHands();

            network.send({ type: 'gameStateFull', payload: gameState.toJSON() });
            redrawTableAndUI();
        }
        // Joiner waits for gameStateFull from initiator
    }

    function handleDataReceived(message: GameMessage) {
        console.log("Data received:", message);
        if (!gameState && message.type !== 'gameStateFull') {
            console.warn("GameState not initialized, ignoring message type:", message.type);
            // Could request a full state sync here if needed
            return;
        }

        switch (message.type) {
            case 'gameStateFull': // Sent by initiator on connect, or for resync
                if (!localPlayerId) {
                    console.error("Received gameStateFull but localPlayerId is not set.");
                    localPlayerId = isInitiatorFlag ? "p0" : "p1"; // Attempt to set it
                }
                gameState = GameState.fromJSON(message.payload, localPlayerId!);
                console.log("Full GameState updated from peer.");
                break;
            case 'gameStateUpdate': // Partial update (less used now with full sync, but could be for efficiency)
                 if (gameState && localPlayerId) {
                    gameState.updateFromJSON(message.payload, localPlayerId);
                    console.log("GameState partially updated from peer.");
                 }
                break;
            case 'playerAction':
                if (gameState && localPlayerId) {
                    const { playerId, action, amount } = message.payload;
                    if (playerId !== localPlayerId) { // Action from peer
                        console.log(`Applying action from peer: ${playerId} ${action} ${amount || ''}`);
                        // The GameState's handlePlayerAction should manage whose turn it is
                        // and if the action is valid.
                        gameState.handlePlayerAction(playerId, action, amount);
                        // handlePlayerAction internally calls advanceToNextPlayerOrRound
                    } else {
                        console.log("Received own action echo, ignoring.");
                    }
                }
                break;
            default:
                console.warn("Unknown message type received:", message.type);
        }
        redrawTableAndUI();
    }

    function handleClose() {
        connectionStatusP.textContent = "Disconnected.";
        localPlayerId = null;
        isInitiatorFlag = false;
        uiManager.toggleNetworkControls(true); // Show network controls again
        uiManager.hideActionControls();
        gameState = undefined; // Clear game state
        redrawTableAndUI(); // Clear table
        if (network) network.disconnect();
    }

    function handleError(err: Error) {
        console.error("Network Error:", err);
        connectionStatusP.textContent = `Error: ${err.message}`;
    }

    network = new Network(handleDataReceived, handleSignal, handleConnect, handleClose, handleError);

    // --- Button Event Listeners for Network Setup ---
    initiateGameButton.addEventListener('click', () => {
        isInitiatorFlag = true;
        outgoingSignalTextarea.value = "";
        incomingSignalTextarea.value = "";
        network.initiateConnection();
        connectionStatusP.textContent = "Initiating...";
    });

    connectToSignalButton.addEventListener('click', () => {
        const signalValue = incomingSignalTextarea.value;
        if (!signalValue) {
            alert("Please paste the peer's signal first.");
            return;
        }
        try {
            const parsedSignal = JSON.parse(signalValue);
            if (network.peer && network.peer.initiator) {
                 network.connectToPeerSignal(parsedSignal);
            } else {
                isInitiatorFlag = false; // Joining an existing offer
                network.connectToPeerSignal(parsedSignal);
            }
            connectionStatusP.textContent = "Signal pasted. Connecting...";
        } catch (e) {
            console.error("Invalid signal format:", e);
            alert("Invalid signal format.");
            connectionStatusP.textContent = "Error: Invalid signal format.";
        }
    });

    // --- Game Action Button Event Listeners ---
    function performPlayerAction(action: 'fold' | 'check' | 'call' | 'bet' | 'raise', getAmountFn?: () => number) {
        if (!gameState || !localPlayerId) {
            console.error("Cannot perform action: game state or local player ID not set.");
            return;
        }
        const currentPlayerInGame = gameState.activePlayers[gameState.currentPlayerIndex];
        if (!currentPlayerInGame || currentPlayerInGame.id !== localPlayerId) {
            alert("Not your turn!");
            console.warn(`Action attempt by ${localPlayerId} but current player is ${currentPlayerInGame?.id}`);
            return;
        }

        let amount: number | undefined = undefined;
        if (action === 'bet' || action === 'raise') {
            if (!getAmountFn) { console.error("Amount function not provided for bet/raise"); return; }
            amount = getAmountFn();
            if (amount === 0 && action === 'bet') { /* UI Manager getBetAmount shows alert */ return; }
            if (amount === 0 && action === 'raise') { /* UI Manager getBetAmount shows alert */ return; }
             // Basic validation for raise amount (must be > 0)
            if (action === 'raise' && amount <= 0) {
                alert("Raise amount must be greater than 0.");
                return;
            }
        }

        // Optimistically apply action locally (will be confirmed by state update if needed)
        // or let GameState handle it and rely on network message for remote echo if strict sync
        const actionSuccess = gameState.handlePlayerAction(localPlayerId, action, amount);

        if (actionSuccess) {
            // Send action to peer
            network.send({
                type: 'playerAction',
                payload: { playerId: localPlayerId, action, amount }
            });
            redrawTableAndUI(); // Update local UI immediately
            uiManager.clearBetAmount();
        } else {
            alert("Invalid action or amount. Check console.");
        }
    }

    foldButton.addEventListener('click', () => performPlayerAction('fold'));
    checkButton.addEventListener('click', () => performPlayerAction('check'));
    callButton.addEventListener('click', () => performPlayerAction('call'));
    betButton.addEventListener('click', () => performPlayerAction('bet', () => uiManager.getBetAmount()));
    raiseButton.addEventListener('click', () => performPlayerAction('raise', () => uiManager.getBetAmount()));


    // --- Helper to Redraw Table and Update UI ---
    function redrawTableAndUI() {
        if (graphics && gameState && localPlayerId) {
            graphics.drawTable(gameState.players, gameState.communityCards, gameState.pot);
            uiManager.updateActionButtons(gameState, localPlayerId);
        } else if (graphics) { // Game ended or not started
            graphics.drawTable([], [], 0); // Draw empty table
            if(uiManager && localPlayerId) uiManager.updateActionButtons(new GameState([],0), localPlayerId); // Show disabled buttons
            else if (uiManager) uiManager.hideActionControls();
        }
    }

    // Initial state
    uiManager.toggleNetworkControls(true);
    uiManager.hideActionControls();
    redrawTableAndUI(); // Draw empty table initially
});

// Ensure SVGGraphics has getSVGElement (already done in previous step, but for clarity)
// In SVGGraphics.ts: public getSVGElement(): SVGSVGElement { return this.svg; }
// GameState.prototype.toJSON and static fromJSON methods were moved to GameState.ts already.
// Player.prototype.toJSON and static fromJSON methods were moved to Player.ts already.
