import { Card, createCard, Rank, Suit } from './Card'; // Ensure createCard is imported

export class Player {
  id: string;
  hand: Card[];
  chips: number;
  currentBet: number;
  folded: boolean;
  isAllIn: boolean;
  name: string;

  constructor(id: string, name: string, initialChips: number) {
    this.id = id;
    this.name = name;
    this.chips = initialChips;
    this.hand = [];
    this.currentBet = 0;
    this.folded = false;
    this.isAllIn = false;
  }

  receiveCard(card: Card): void {
    this.hand.push(card);
  }

  clearHand(): void {
    this.hand = [];
    this.currentBet = 0; // Reset per-round bet
    this.folded = false;
    this.isAllIn = false; // isAllIn should persist if chips are 0, but can be reset if chips are added.
                         // For simplicity, reset here. Real game might need more nuanced logic if player buys back in etc.
  }

  fold(): void {
    this.folded = true;
    console.log(`${this.name} folds.`);
  }

  private placeBet(amount: number): number {
    const betAmount = Math.min(amount, this.chips);
    this.chips -= betAmount;
    this.currentBet += betAmount;
    if (this.chips === 0) {
      this.isAllIn = true;
      console.log(`${this.name} is All-In!`);
    }
    return betAmount;
  }

  bet(amount: number): number {
    console.log(`${this.name} bets ${amount}.`);
    return this.placeBet(amount);
  }

  call(currentRoundBet: number): number {
    const amountToCall = currentRoundBet - this.currentBet;
    if (amountToCall <= 0) {
      console.log(`${this.name} checks.`);
      return 0;
    }
    console.log(`${this.name} calls ${amountToCall}.`);
    return this.placeBet(amountToCall);
  }

  raise(raiseAmount: number, currentRoundBetForAction: number): number {
    // raiseAmount is the additional amount on top of the currentRoundBetForAction they are facing.
    // The total bet they will have made this round is currentRoundBetForAction + raiseAmount.
    // The actual chips they need to put in is (currentRoundBetForAction + raiseAmount) - this.currentBet.
    const amountToPlace = (currentRoundBetForAction + raiseAmount) - this.currentBet;
    console.log(`${this.name} raises by ${raiseAmount} (total bet this round will be ${this.currentBet + amountToPlace}).`);
    return this.placeBet(amountToPlace);
  }

  winPot(amount: number): void {
    this.chips += amount;
    console.log(`${this.name} wins ${amount} chips.`);
  }

  returnBet(amount: number): void {
    this.chips += amount;
    this.currentBet -= amount; // Reduce their current bet amount by what's returned
  }

  // --- Serialization methods ---
  public toJSON(): object {
    return {
      id: this.id,
      name: this.name, // Name might be changed to "You" or "Peer" by GameState during its own toJSON/fromJSON
      chips: this.chips,
      currentBet: this.currentBet,
      folded: this.folded,
      isAllIn: this.isAllIn,
      hand: this.hand.map(card => ({ rank: card.rank, suit: card.suit })),
    };
  }

  public static fromJSON(json: any): Player {
    const player = new Player(json.id, json.name, json.chips);
    player.currentBet = json.currentBet;
    player.folded = json.folded;
    player.isAllIn = json.isAllIn;
    player.hand = json.hand.map((c: {rank: Rank, suit: Suit}) => createCard(c.rank, c.suit));
    return player;
  }

  public updateFromJSON(json: any): void {
    this.chips = json.chips;
    this.currentBet = json.currentBet;
    this.folded = json.folded;
    this.isAllIn = json.isAllIn;
    this.hand = json.hand.map((c: {rank: Rank, suit: Suit}) => createCard(c.rank, c.suit));
    // Note: 'name' is intentionally not updated here as GameState handles "You"/"Peer" assignment.
    // If general name changes were allowed, this would be different.
  }
}
