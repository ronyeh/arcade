import { Card, createCard, Rank, Suit } from './Card';
import { Deck } from './Deck';
import { Player } from './Player';
import { HandEvaluator, HandEvaluationResult, HAND_RANKS } from './HandEvaluator';

export enum BettingRound {
  Preflop,
  Flop,
  Turn,
  River,
  Showdown,
  GameOver,
}

export class GameState {
  players: Player[];
  deck: Deck;
  communityCards: Card[];
  pot: number;
  currentPlayerIndex: number; // Index within activePlayers
  currentRoundBet: number; // Highest total bet made by any player in this round
  bettingRound: BettingRound;
  dealerIndex: number; // Index within the main players array (who has the button)
  handEvaluator: HandEvaluator;
  minRaiseAmount: number; // Minimum additional amount for a raise
  bigBlind: number;
  smallBlind: number;
  activePlayers: Player[]; // Players currently in the hand (not folded, have chips)
  lastPlayerToRaiseId?: string; // ID of the player who made the last aggressive action (bet/raise)

  constructor(playerNames: string[], initialChips: number, sb: number = 5, bb: number = 10) {
    this.players = playerNames.map((name, index) => new Player(`p${index}`, name, initialChips));
    this.deck = new Deck();
    this.handEvaluator = new HandEvaluator();
    this.smallBlind = sb;
    this.bigBlind = bb;
    this.minRaiseAmount = bb;

    this.dealerIndex = -1;
    this.communityCards = [];
    this.pot = 0;
    this.currentPlayerIndex = 0;
    this.currentRoundBet = 0;
    this.bettingRound = BettingRound.Preflop;
    this.activePlayers = [];
  }

  setupNewHand(): void {
    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.currentRoundBet = 0;
    this.minRaiseAmount = this.bigBlind;
    this.lastPlayerToRaiseId = undefined;

    this.players.forEach(p => p.clearHand()); // Resets hand, folded, currentBet, isAllIn
    this.activePlayers = this.players.filter(p => p.chips > 0);

    if (this.activePlayers.length < 2) {
      this.bettingRound = BettingRound.GameOver;
      console.log("Game Over: Not enough players with chips.");
      return;
    }

    // Rotate dealer button among ALL players, then find active players for blinds
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    // Determine SB and BB players from active players relative to dealer
    // This needs to correctly find active players in sequence after the dealer button.
    let sbPos = (this.dealerIndex + 1) % this.players.length;
    while(!this.activePlayers.find(p => p.id === this.players[sbPos].id) || this.players[sbPos].chips === 0) {
        sbPos = (sbPos + 1) % this.players.length;
    }
    let bbPos = (sbPos + 1) % this.players.length;
    while(!this.activePlayers.find(p => p.id === this.players[bbPos].id) || this.players[bbPos].chips === 0) {
        bbPos = (bbPos + 1) % this.players.length;
    }

    const sbPlayer = this.players[sbPos];
    const bbPlayer = this.players[bbPos];

    console.log(`Dealer is ${this.players[this.dealerIndex].name}`);

    // Post blinds by adding to pot and updating player's currentBet
    this.pot += sbPlayer.bet(this.smallBlind); // bet() updates player.currentBet and player.chips
    console.log(`${sbPlayer.name} posts small blind ${this.smallBlind}. CurrentBet: ${sbPlayer.currentBet}`);
    this.pot += bbPlayer.bet(this.bigBlind);
    console.log(`${bbPlayer.name} posts big blind ${this.bigBlind}. CurrentBet: ${bbPlayer.currentBet}`);

    this.currentRoundBet = this.bigBlind; // The current bet to match is the big blind
    this.lastPlayerToRaiseId = bbPlayer.id; // BB is effectively the first "raiser"

    // Determine player to act first (UTG)
    let utgPos = (bbPos + 1) % this.players.length;
    while(!this.activePlayers.find(p => p.id === this.players[utgPos].id) || this.players[utgPos].chips === 0) {
        utgPos = (utgPos + 1) % this.players.length;
         if (utgPos === bbPos) break; // Safety for very few players
    }
    this.currentPlayerIndex = this.activePlayers.findIndex(p => p.id === this.players[utgPos].id);

    this.bettingRound = BettingRound.Preflop;
    console.log(`New hand. Dealer: ${this.players[this.dealerIndex].name}. SB: ${sbPlayer.name}, BB: ${bbPlayer.name}.`);
    if(this.currentPlayerIndex !== -1) console.log(`Action starts with: ${this.activePlayers[this.currentPlayerIndex].name}.`);
    else console.log("Error determining first player to act.");
  }

  dealHands(): void { /* ... no change ... */
    if (this.bettingRound !== BettingRound.Preflop) return;
    console.log("Dealing hands...");
    for (let i = 0; i < 2; i++) {
      for (const player of this.activePlayers) {
        if (!player.folded && player.chips > 0) {
            const card = this.deck.deal();
            if (card) player.receiveCard(card);
        }
      }
    }
    this.activePlayers.forEach(p => {
        if (!p.folded) console.log(`${p.name} has: ${p.hand.map(c => c.toString()).join(', ')}`);
    });
  }
  dealFlop(): void { /* ... no change ... */
    if (this.bettingRound !== BettingRound.Flop) return;
    console.log("Dealing flop...");
    this.deck.deal();
    for (let i = 0; i < 3; i++) {
      const card = this.deck.deal();
      if (card) this.communityCards.push(card);
    }
    console.log(`Flop: ${this.communityCards.map(c => c.toString()).join(', ')}`);
  }
  dealTurn(): void { /* ... no change ... */
    if (this.bettingRound !== BettingRound.Turn) return;
    console.log("Dealing turn...");
    this.deck.deal();
    const card = this.deck.deal();
    if (card) this.communityCards.push(card);
    console.log(`Turn: ${this.communityCards[this.communityCards.length -1].toString()} (Board: ${this.communityCards.map(c=>c.toString()).join(', ')})`);
  }
  dealRiver(): void { /* ... no change ... */
    if (this.bettingRound !== BettingRound.River) return;
    console.log("Dealing river...");
    this.deck.deal();
    const card = this.deck.deal();
    if (card) this.communityCards.push(card);
    console.log(`River: ${this.communityCards[this.communityCards.length -1].toString()} (Board: ${this.communityCards.map(c=>c.toString()).join(', ')})`);
  }

  private collectBetsAndStartNextRound(): void {
    // Pot was already updated incrementally by handlePlayerAction.
    // Bets are on player.currentBet. This method finalizes them for the round.
    console.log("Collecting bets for the round.");
    // this.activePlayers.filter(p => !p.folded).forEach(player => {
    //     // Pot already includes these amounts if handlePlayerAction updates pot directly
    //     // If not, this is where you'd add player.currentBet to pot.
    //     // player.currentBet = 0; // Reset for next round
    // });
    // currentRoundBet and minRaiseAmount are reset here before next round dealing.
    this.currentRoundBet = 0;
    this.minRaiseAmount = this.bigBlind;
    this.lastPlayerToRaiseId = undefined;
    this.activePlayers.filter(p => !p.folded).forEach(p => p.currentBet = 0);


    // Determine first player to act in post-flop rounds (typically SB or first active player left of dealer)
    // The dealerIndex here is from the main `this.players` array.
    let firstToActGlobalIndex = (this.dealerIndex + 1) % this.players.length;
    while(!this.activePlayers.find(p => p.id === this.players[firstToActGlobalIndex].id) || this.players[firstToActGlobalIndex].folded || this.players[firstToActGlobalIndex].isAllIn) {
        firstToActGlobalIndex = (firstToActGlobalIndex + 1) % this.players.length;
        if (firstToActGlobalIndex === (this.dealerIndex + 1) % this.players.length) break; // Safety break
    }
    this.currentPlayerIndex = this.activePlayers.findIndex(p => p.id === this.players[firstToActGlobalIndex].id);


    switch (this.bettingRound) {
      case BettingRound.Preflop:
        this.bettingRound = BettingRound.Flop; this.dealFlop(); break;
      case BettingRound.Flop:
        this.bettingRound = BettingRound.Turn; this.dealTurn(); break;
      case BettingRound.Turn:
        this.bettingRound = BettingRound.River; this.dealRiver(); break;
      case BettingRound.River:
        this.bettingRound = BettingRound.Showdown; this.determineWinner(); break;
      default: console.log("Cannot start next betting round from current state:", this.bettingRound); return;
    }

     if (this.bettingRound !== BettingRound.Showdown && this.bettingRound !== BettingRound.GameOver) {
        if (this.currentPlayerIndex !== -1 && this.activePlayers[this.currentPlayerIndex]) {
            console.log(`Starting ${BettingRound[this.bettingRound]} betting round. ${this.activePlayers[this.currentPlayerIndex].name} to act.`);
        } else if (this.activePlayers.filter(p => !p.folded && !p.isAllIn).length > 0) {
            // If firstToAct was all-in, find next available player.
            // This case should be rare if firstToActGlobalIndex correctly skips all-in players.
            this.currentPlayerIndex = this.activePlayers.findIndex(p => !p.folded && !p.isAllIn);
            if(this.currentPlayerIndex !== -1) console.log(`Starting ${BettingRound[this.bettingRound]} betting round. ${this.activePlayers[this.currentPlayerIndex].name} to act (first was all-in/folded).`);
            else { // All remaining are all-in, auto-progress
                 console.log(`${BettingRound[this.bettingRound]} betting round, but all players are all-in or folded. Proceeding.`);
                 this.collectBetsAndStartNextRound(); // Effectively skip betting on this street
            }
        } else {
             console.log(`${BettingRound[this.bettingRound]} betting round, but no player can act. Proceeding to showdown/end.`);
             this.bettingRound = BettingRound.Showdown; this.determineWinner();
        }
    }
  }

  handlePlayerAction(playerId: string, action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number): boolean {
    const player = this.activePlayers.find(p => p.id === playerId);
    if (!player || player.id !== this.activePlayers[this.currentPlayerIndex]?.id) {
        console.error(`Action by wrong player (${playerId}) or player not found. Current is ${this.activePlayers[this.currentPlayerIndex]?.id}`);
        return false;
    }
    if (player.folded || player.isAllIn) {
        console.log(`Player ${player.name} cannot act (folded/all-in). Advancing.`);
        this.advanceToNextPlayerOrRound();
        return false;
    }

    let chipsCommitted = 0; // How much this player added to pot in this action

    switch (action) {
      case 'fold':
        player.fold();
        console.log(`${player.name} folds.`);
        break;
      case 'check':
        if (player.currentBet < this.currentRoundBet) {
          console.log(`${player.name} cannot check, current bet is ${this.currentRoundBet}. Must call ${this.currentRoundBet - player.currentBet} or raise.`);
          return false;
        }
        console.log(`${player.name} checks.`);
        break;
      case 'call':
        if (player.currentBet >= this.currentRoundBet) {
             console.log(`${player.name} tries to call but has already matched the bet or bet more. Interpreting as check.`);
             // Treat as check if already matched/exceeded
        } else {
            chipsCommitted = player.call(this.currentRoundBet); // call() updates player.currentBet and player.chips
            this.pot += chipsCommitted;
            console.log(`${player.name} calls ${chipsCommitted}. Player total bet this round: ${player.currentBet}`);
        }
        break;
      case 'bet':
        if (this.currentRoundBet > 0) {
          console.log(`${player.name} cannot bet, currentRoundBet is ${this.currentRoundBet}. Must call or raise.`);
          return false;
        }
        if (!amount || amount <= 0) { console.log("Bet amount invalid."); return false;}
        if (amount < this.minRaiseAmount && player.chips > amount) { // Allow all-in for less
            console.log(`${player.name} bet amount ${amount} is less than min bet ${this.minRaiseAmount}.`);
            return false;
        }
        chipsCommitted = player.bet(amount); // bet() updates player.currentBet and player.chips
        this.pot += chipsCommitted;
        this.currentRoundBet = player.currentBet;
        this.minRaiseAmount = amount; // The bet amount becomes the new minimum raise amount on top for next player
        this.lastPlayerToRaiseId = player.id;
        console.log(`${player.name} bets ${chipsCommitted}. CurrentRoundBet: ${this.currentRoundBet}. MinRaise: ${this.minRaiseAmount}`);
        break;
      case 'raise':
        if (this.currentRoundBet === 0) { console.log("Cannot raise, no bet yet. Use 'bet'."); return false; }
        if (!amount || amount <= 0) { console.log("Raise amount invalid."); return false;}

        const totalNewBet = this.currentRoundBet + amount; // `amount` is the raise ON TOP of currentRoundBet
        // Min raise validation: The raise amount must be at least minRaiseAmount
        if (amount < this.minRaiseAmount && player.chips > totalNewBet) { // Allow all-in for less
            console.log(`${player.name} raise amount ${amount} is less than min raise amount ${this.minRaiseAmount}.`);
            return false;
        }
        // Player.raise expects the "additional amount" and "what they are raising over"
        // Here, 'amount' is the additional amount.
        chipsCommitted = player.raise(amount, this.currentRoundBet);
        this.pot += chipsCommitted;
        this.currentRoundBet = player.currentBet; // player.currentBet is now the new total highest bet
        this.minRaiseAmount = amount; // The 'additional amount' of the raise is the new minRaiseAmount
        this.lastPlayerToRaiseId = player.id;
        console.log(`${player.name} raises by ${amount} to ${this.currentRoundBet}. MinRaise for next: ${this.minRaiseAmount}`);
        break;
      default:
        console.error("Unknown action:", action);
        return false;
    }
    this.advanceToNextPlayerOrRound();
    return true;
  }

  advanceToNextPlayerOrRound(): void {
    const nonFoldedPlayers = this.activePlayers.filter(p => !p.folded);
    if (nonFoldedPlayers.length === 1) {
      this.awardPotToWinner(nonFoldedPlayers[0]);
      this.setupNewHand();
      return;
    }

    // Determine if all active players have had a chance to act after the last raise.
    // Or if all players have matched currentRoundBet or are all-in.
    let nextActorIndex = (this.currentPlayerIndex + 1) % this.activePlayers.length;
    while(this.activePlayers[nextActorIndex].folded || this.activePlayers[nextActorIndex].isAllIn) {
        nextActorIndex = (nextActorIndex + 1) % this.activePlayers.length;
        // Safety: if it loops back to current player, means everyone else is folded/allin
        if (nextActorIndex === this.currentPlayerIndex) break;
    }

    // Check if the betting round is over
    // Round ends if:
    // 1. All non-folded players are all-in.
    // 2. All non-folded players have had a turn and their currentBet matches currentRoundBet,
    //    AND the action is back to the player who made the last aggressive action (or would be if they weren't all-in/folded),
    //    OR if only one player is left who is not all-in.
    //    A simpler check: current player is the one who made the last raise, and everyone else has called or folded.
    //    Or, everyone has checked around.

    const playerWhoWasLastToRaise = this.activePlayers.find(p => p.id === this.lastPlayerToRaiseId);
    const indexOfLastRaiser = playerWhoWasLastToRaise ? this.activePlayers.indexOf(playerWhoWasLastToRaise) : -1;

    // If next player to act IS the last aggressor, or would be if they could act (they are all-in)
    // AND all other non-folded players have currentBet === currentRoundBet
    const allOthersMatched = nonFoldedPlayers.every(p => p.id === this.lastPlayerToRaiseId || p.currentBet === this.currentRoundBet || p.isAllIn || p.folded);

    if (this.lastPlayerToRaiseId && this.activePlayers[nextActorIndex].id === this.lastPlayerToRaiseId && allOthersMatched) {
         console.log("Betting round ended. Action back to last raiser who has already acted or all matched.");
         this.collectBetsAndStartNextRound();
         return;
    }
    // Case: Everyone checks around (currentRoundBet is 0 and action is back to where it would be after BB)
    if (this.currentRoundBet === 0 && this.lastPlayerToRaiseId === undefined) { // No bets yet in this round
        // If action is about to return to the player who would have been opener (e.g. UTG preflop, SB postflop)
        // This needs a concept of "who opened action this round" or "has everyone had a turn"
        // For now, a simpler check: if the next player is the one who started this round of betting
        // (e.g. SB post-flop, or UTG pre-flop) then if they check, round is over.
        // This is complex. A simpler check: if the next player to act has already matched the currentRoundBet (which is 0)
        // and it's not the very first action of the round.
        // A common way: if player `nextActorIndex` has already had a turn to act against the current `currentRoundBet`.
        // If `this.activePlayers[nextActorIndex].currentBet === this.currentRoundBet` AND they are not the BB who hasn't acted on option yet preflop.
        // For simplicity, if nextActorIndex IS the player who would be the last to act if everyone called/checked (e.g. BB preflop, button postflop)
        // AND their currentBet matches currentRoundBet, the round ends.
        // This requires more state tracking (e.g. hasActedThisRound flags per player).
        // The condition `allNonFoldedMatchedOrAllIn` from previous `nextPlayer` version combined with `playersToAct.length === 0` is often used.
        const playersWhoCanStillAct = nonFoldedPlayers.filter(p => !p.isAllIn && p.currentBet < this.currentRoundBet);
        if (playersWhoCanStillAct.length === 0 && nonFoldedPlayers.every(p => p.currentBet === this.currentRoundBet || p.isAllIn || p.folded)) {
            console.log("Betting round ended. All players matched, are all-in, or folded.");
            this.collectBetsAndStartNextRound();
            return;
        }
    }


    this.currentPlayerIndex = nextActorIndex;
    if (this.currentPlayerIndex !== -1 && this.activePlayers[this.currentPlayerIndex]) {
         console.log(`Next to act: ${this.activePlayers[this.currentPlayerIndex].name}`);
    } else {
        console.error("Could not determine next player. Ending round.");
        this.collectBetsAndStartNextRound();
    }
  }

  private awardPotToWinner(winner: Player): void { /* ... no change ... */
    console.log(`${winner.name} wins the pot of ${this.pot}!`);
    winner.winPot(this.pot);
    this.pot = 0;
  }
  determineWinner(): void { /* ... no change ... */
    if (this.bettingRound !== BettingRound.Showdown) return;
    console.log("Determining winner...");
    const contenders = this.activePlayers.filter(p => !p.folded);
    if (contenders.length === 0) { this.bettingRound = BettingRound.GameOver; this.setupNewHand(); return; } // Call setupNewHand if game not over
    if (contenders.length === 1) { this.awardPotToWinner(contenders[0]); this.setupNewHand(); return; }

    let bestHandResults: { player: Player, eval: HandEvaluationResult }[] = [];
    contenders.forEach(player => {
      const allCards = [...player.hand, ...this.communityCards];
      const currentEval = this.handEvaluator.evaluateHand(allCards);
      console.log(`${player.name} has ${player.hand.map(c=>c.toString())} (Board: ${this.communityCards.map(c=>c.toString())}) - ${currentEval.handName} (Value: ${currentEval.value})`);
      if (bestHandResults.length === 0 || currentEval.rank > bestHandResults[0].eval.rank) {
        bestHandResults = [{ player, eval: currentEval }];
      } else if (currentEval.rank === bestHandResults[0].eval.rank) {
        let tie = false;
        for (let i = 0; i < currentEval.value.length; i++) {
          if (currentEval.value[i] > bestHandResults[0].eval.value[i]) { bestHandResults = [{ player, eval: currentEval }]; tie = false; break; }
          if (currentEval.value[i] < bestHandResults[0].eval.value[i]) { tie = false; break; }
          if (i === currentEval.value.length - 1) tie = true;
        }
        if (tie) bestHandResults.push({ player, eval: currentEval });
      }
    });

    if (bestHandResults.length > 0) {
        if (bestHandResults.length === 1) this.awardPotToWinner(bestHandResults[0].player);
        else {
            const winners = bestHandResults.map(r => r.player.name).join(', ');
            console.log(`Split pot between: ${winners} with ${bestHandResults[0].eval.handName}`);
            const splitAmount = Math.floor(this.pot / bestHandResults.length);
            bestHandResults.forEach(res => res.player.winPot(splitAmount));
            this.pot = 0;
        }
    } else console.log("Error: Could not determine a winner.");
    console.log("Showdown finished.");
    this.setupNewHand();
  }

  // --- Serialization methods ---
  public toJSON(): object { /* ... no change ... */
    return {
        players: this.players.map(p => p.toJSON()),
        communityCards: this.communityCards.map(c => ({ rank: c.rank, suit: c.suit })),
        pot: this.pot,
        currentActivePlayerId: this.activePlayers[this.currentPlayerIndex]?.id,
        currentRoundBet: this.currentRoundBet,
        bettingRound: this.bettingRound,
        dealerIndex: this.dealerIndex,
        minRaiseAmount: this.minRaiseAmount, // Changed from minRaise
        bigBlind: this.bigBlind,
        smallBlind: this.smallBlind,
        lastPlayerToRaiseId: this.lastPlayerToRaiseId,
    };
  }
  public static fromJSON(json: any, localPlayerActualId: string): GameState { /* ... no change ... */
    const gs = new GameState([], 0, json.smallBlind, json.bigBlind);
    gs.players = json.players.map((pData: any) => {
        const name = pData.id === localPlayerActualId ? "You" : `Peer (${pData.id})`;
        const player = Player.fromJSON(pData);
        player.name = name;
        return player;
    });
    gs.communityCards = json.communityCards.map((c: {rank: Rank, suit: Suit}) => createCard(c.rank, c.suit));
    gs.pot = json.pot;
    gs.dealerIndex = json.dealerIndex;
    gs.activePlayers = gs.players.filter(p => p.chips > 0 && !p.folded);
    const activePlayerFromSignal = gs.activePlayers.find(p => p.id === json.currentActivePlayerId);
    if (activePlayerFromSignal) gs.currentPlayerIndex = gs.activePlayers.indexOf(activePlayerFromSignal);
    else if (gs.activePlayers.length > 0) gs.currentPlayerIndex = 0;
    else gs.currentPlayerIndex = -1;
    gs.currentRoundBet = json.currentRoundBet;
    gs.bettingRound = json.bettingRound;
    gs.minRaiseAmount = json.minRaiseAmount || json.bigBlind; // fallback for older states
    gs.lastPlayerToRaiseId = json.lastPlayerToRaiseId;
    console.log("GameState hydrated from JSON:", gs);
    return gs;
  }
  public updateFromJSON(json: any, localPlayerActualId: string): void { /* ... no change ... */
    json.players.forEach((pData: any) => {
        const localPlayer = this.players.find(p => p.id === pData.id);
        if (localPlayer) {
            localPlayer.updateFromJSON(pData);
            localPlayer.name = pData.id === localPlayerActualId ? "You" : `Peer (${pData.id})`;
        } else console.warn(`Player with id ${pData.id} from JSON not found locally.`);
    });
    this.communityCards = json.communityCards.map((c: {rank: Rank, suit: Suit}) => createCard(c.rank, c.suit));
    this.pot = json.pot;
    this.activePlayers = this.players.filter(p => p.chips > 0 && !p.folded);
    const activePlayerFromSignal = this.activePlayers.find(p => p.id === json.currentActivePlayerId);
    if (activePlayerFromSignal) this.currentPlayerIndex = this.activePlayers.indexOf(activePlayerFromSignal);
    else if (this.activePlayers.length > 0) this.currentPlayerIndex = 0;
    else this.currentPlayerIndex = -1;
    this.currentRoundBet = json.currentRoundBet;
    this.bettingRound = json.bettingRound;
    this.minRaiseAmount = json.minRaiseAmount || json.bigBlind;
    this.lastPlayerToRaiseId = json.lastPlayerToRaiseId;
    console.log("GameState updated by peer data.");
  }
}
