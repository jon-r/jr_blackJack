/** class Player represents a singple playable user. */
export default class Player {
  /**
   * sets up a new player object
   * @param {string} name - The name of the player.
   */
  constructor(name) {
    this.name = name;
    this.cardCount = 0;
    this.money = 1000;
    this.bid = 0;
    this.score = 0;
    this.hand = [];
    this.hardAce = true;
    this.skip = false;
  }

  /**
   * resets the settings for the next round without changing the player's money or name
   */
  restart() {
    this.cardCount = 0;
    this.score = 0;
    this.hand = [];
    this.bid = 0;
    this.hardAce = true;
  }

  /**
   * draws a card from the deck and adds it to the player's hand.
   * @param   {object} newCard - card dealt
   * @returns {object} result - the card score, and if this card forces the player to skip.
   */
  draw(newCard) {
    this.cardCount += 1;
    this.hand.push(newCard);
    this.score += newCard.score;

    const endTurn = false;
    const firstScore = this.cardCount < 3;
    const softAce = this.hand.some(card => card.face === 'A');

    let thisScore = this.score;

    if (thisScore > 21 && this.hardAce) {
      return {
        scoreStr: `Bust ${thisScore}`,
        endTurn: true,
      };
    }

    if (thisScore > 21 && softAce) {
      this.hardAce = true;
      thisScore -= 10;
      // COULD BUG HERE. THOUGH ALREADY PROBABLY DID
    }

    if (firstScore && thisScore === 21) {
      thisScore = `BlackJack ${thisScore}`;
    }

    if (softAce && thisScore < 21) {
      this.hardAce = false;
      thisScore = `Soft ${thisScore}`;
    }

    return { scoreStr: thisScore, endTurn };
  }

  /**
   * checks if the player has enough money to double his bet
   * @returns {boolean} the bid can be doubled
   */
  canDouble() {
    return this.bid * 2 <= this.money;
  }

  /**
   * calculates the betting return to the player
   * @param   {number} dlrScore - the score of the dealer this turn
   * @param   {number} dlrCount - the number of cards the dealer drew
   * @returns {number} money - the round's bettings win
   */
  getMoney(dlrScore, dlrCount) {
    const plyrScore = this.score;
    const dlrBlackJack = (dlrScore === 21 && dlrCount < 3);
    const blackJack = (plyrScore === 21 && this.cardCount < 3);

    let odds = 2;

    if (plyrScore < 22) {
      if (blackJack && !dlrBlackJack) {
        odds = 1.5;
      } else if (plyrScore > dlrScore || dlrScore > 21) {
        odds = 1;
      } else if ((blackJack && dlrBlackJack) || (plyrScore === dlrScore)) {
        odds = 0;
      } else {
        odds = -1;
      }
    } else {
      odds = -1;
    }

    this.money += this.bid * odds;

    return this.money;
  }
}
