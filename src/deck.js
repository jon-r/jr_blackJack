/** class Deck represents the deck of cards */
export default class Deck {
  /**
   * Sets up a new deck oject
   * @param {number} deckCount - number of decks to use
   */
  constructor(deckCount) {
    this.cards = [];
    this.count = deckCount;
    this.build();
  }

  /**
   * Builds a deck of cards for the dealer to use.
   * Iterates through n = [this.count] decks, 4 suits and 14 cards per suit.
   */
  build() {
    let i = 0;
    let j = 0;
    let k = 1;

    while (i < this.count) {
      while (j < 4) {
        while (k < 14) {
          this.cards.push([k, j]);
          k += 1;
        }
        j += 1;
      }
      i += 1;
    }
  }

  /**
   * rebuilds the deck without changing the deck count
   */
  restart() {
    this.cards = [];
    this.build();
  }

  /**
   * draws a single card at random and gives it a name and score.
   * @returns {Object} card - card with face value and name.
   */
  deal() {
    const rng = Math.floor(Math.random() * this.cards.length);
    const cardArr = this.cards.splice(rng, 1)[0];
    const faceValue = cardArr[0];
    const suitValue = cardArr[1];
    const suits = ['diamonds', 'hearts', 'spades', 'clubs'];
    const faces = {
      1: ['A', 11],
      11: ['J', 10],
      12: ['Q', 10],
      13: ['K', 10],
    };
    const card = { suit: suits[suitValue], face: faceValue, score: faceValue };

    if (cardArr[0] in faces) {
      card.face = faces[faceValue][0].charAt(0);
      card.score = faces[faceValue][1];
    }

    return card;
  }

}
