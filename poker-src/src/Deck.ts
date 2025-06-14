import { Card, Suit, Rank, createCard } from './Card';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = [];
    this.initializeDeck();
  }

  private initializeDeck(): void {
    this.cards = [];
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        this.cards.push(createCard(rank, suit));
      }
    }
  }

  shuffle(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): Card | undefined {
    if (this.cards.length === 0) {
      return undefined; // Or throw an error
    }
    return this.cards.pop();
  }

  getCardsCount(): number {
    return this.cards.length;
  }

  reset(): void {
    this.initializeDeck();
    this.shuffle();
  }
}

// Example Usage (can be removed later)
// const deck = new Deck();
// deck.shuffle();
// console.log(`Deck has ${deck.getCardsCount()} cards.`);
// const card1 = deck.deal();
// console.log(`Dealt: ${card1?.toString()}`);
// console.log(`Deck has ${deck.getCardsCount()} cards remaining.`);
// const card2 = deck.deal();
// console.log(`Dealt: ${card2?.toString()}`);
// console.log(`Deck has ${deck.getCardsCount()} cards remaining.`);

// for (let i = 0; i < 55; i++) { // Test dealing all cards + one more
//   const card = deck.deal();
//   console.log(`Dealt: ${card?.toString()}, Remaining: ${deck.getCardsCount()}`);
// }
