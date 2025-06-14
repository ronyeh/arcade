export enum Suit {
  Hearts = 'H',
  Diamonds = 'D',
  Clubs = 'C',
  Spades = 'S',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  toString(): string;
}

export function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    toString() {
      return `${this.rank}${this.suit}`;
    },
  };
}

// Example Usage (can be removed later)
// const card1 = createCard(Rank.Ace, Suit.Hearts);
// console.log(card1.toString()); // AH
// const card2 = createCard(Rank.Ten, Suit.Spades);
// console.log(card2.toString()); // TS
