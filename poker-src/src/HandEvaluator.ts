import { Card, Rank } from './Card';

// Hand Ranks (lower number is better, traditionally)
// For simplicity here, let's use higher number = better hand for now.
// We can reverse this if needed.
export const HAND_RANKS = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

// For tie-breaking, numeric values of ranks are useful.
// Ace can be high (14) or low (1 for A-5 straight).
export const RANK_VALUES: { [key in Rank]: number } = {
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 11,
  [Rank.Queen]: 12,
  [Rank.King]: 13,
  [Rank.Ace]: 14, // Ace high by default
};


export interface HandEvaluationResult {
  rank: number; // One of HAND_RANKS
  value: number[]; // Values for tie-breaking (e.g., [RankValue_Pair, Kicker1, Kicker2, Kicker3, Kicker4])
  handName: string; // e.g., "Pair of Kings"
}

export class HandEvaluator {
  constructor() {}

  // Placeholder: very basic evaluation (e.g., highest card)
  // A full implementation is complex and will be done later.
  evaluateHand(hand: Card[]): HandEvaluationResult {
    if (!hand || hand.length === 0) {
      return { rank: HAND_RANKS.HIGH_CARD, value: [0], handName: 'No cards' };
    }

    // Sort hand by rank (descending) for easier high card eval
    const sortedHand = [...hand].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);

    const highestCardValue = RANK_VALUES[sortedHand[0].rank];

    // This is a very simplified placeholder.
    // For now, just return High Card based on the highest card in the hand.
    // The value array will contain all card ranks in descending order for tie-breaking.
    const tieBreakerValues = sortedHand.map(card => RANK_VALUES[card.rank]);

    return {
      rank: HAND_RANKS.HIGH_CARD,
      value: tieBreakerValues,
      handName: `High Card: ${sortedHand[0].rank}`,
    };
  }
}

// Example Usage (can be removed later)
// import { createCard, Suit } from "./Card";
// const evaluator = new HandEvaluator();
// const hand1: Card[] = [
//   createCard(Rank.Ace, Suit.Hearts),
//   createCard(Rank.King, Suit.Diamonds),
//   createCard(Rank.Five, Suit.Clubs),
//   createCard(Rank.Two, Suit.Spades),
//   createCard(Rank.Seven, Suit.Hearts),
// ];
// const hand2: Card[] = [
//   createCard(Rank.Queen, Suit.Hearts),
//   createCard(Rank.King, Suit.Diamonds),
//   createCard(Rank.Five, Suit.Clubs),
//   createCard(Rank.Two, Suit.Spades),
//   createCard(Rank.Seven, Suit.Hearts),
// ];

// const result1 = evaluator.evaluateHand(hand1); // 5 cards for a typical hand
// console.log(`Hand 1: ${hand1.map(c=>c.toString())} -> Rank: ${result1.rank}, Value: ${result1.value}, Name: ${result1.handName}`);

// const result2 = evaluator.evaluateHand(hand2);
// console.log(`Hand 2: ${hand2.map(c=>c.toString())} -> Rank: ${result2.rank}, Value: ${result2.value}, Name: ${result2.handName}`);

// // Test with 7 cards (community + player)
// const communityCards: Card[] = [
//   createCard(Rank.Ten, Suit.Clubs),
//   createCard(Rank.Jack, Suit.Hearts),
//   createCard(Rank.Queen, Suit.Diamonds),
// ];
// const playerHandFull = [...hand1, ...communityCards];
// const resultFull = evaluator.evaluateHand(playerHandFull);
// console.log(`Full Hand: ${playerHandFull.map(c=>c.toString())} -> Rank: ${resultFull.rank}, Value: ${resultFull.value}, Name: ${resultFull.handName}`);
