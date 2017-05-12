import Menu from './menu';
import Player from './player';
import Deck from './deck';
import UI from './ui';

/*
TO DO

optimise
- new 'update player ui' function

side rules
- disable all side rules after first draw (can only be used once)
- splitting: second set of 'hit/stand/score functions?

visual
- add random variation to the dealt cards
- shuffling ui for split?
- blackjack table text
- general prettyness

*/

window.addEventListener('ready', (function playBlackJack(doc) {
  /** Class blackjack represents the core game controller */
  class BlackJack {

    /**
     * Starts the game by locating the gameboard
     * @param {string} board - query selector to set as the visual game ui.
     */
    constructor(board) {
      const tblQuery = board || '[data-blackjack]';

      this.table = doc.querySelector(tblQuery);
      this.menu = new Menu(this.table, this.gamePlay.new);
    }

    /**
     * Empties the board to start a new Game.
     * Creates the players, deck & in game UI, and then starts the gameplay.
     * @param {object} opts - Options usually defined in the startup menu
     *
     */
    newGame(opts = {}) {
      const table = this.table;

      while (table.firstChild) table.removeChild(table.firstChild);

      this.options = {
        deckCount: opts.deckCount || 6,
        players: ['Dealer'].concat(opts.players || ['player-1']),
      };
      this.current = 1;
      this.players = this.options.players.map(name => new Player(name));
      this.activeCount = this.players.length;
      this.deck = new Deck(this.options.deckCount);
      this.ui = new UI(this);
      this.ui.getButton('ctrl-bid').disabled = this.ui.checkBids();
    }

    /**
     * Clears the board to start a new round without reseting player money or options
     */
    restart() {
      this.current = 1;
      this.players.forEach((player, idx) => {
        player.restart();
        if (player.skip && idx === this.current) this.current += 1;
      });
      this.ui.restart();
      // this.dealAll();
      this.ui.getButton('ctrl-bid').disabled = this.ui.checkBids();
    }

    /**
     * Deals the cards to all active players. Loops out until every player has two cards.
     */
    dealAll() {
      const dealer = this.ui.playerOutputs[0];

      this.ui.deal(this.current);

      ['ctrl-double', 'ctrl-hit', 'ctrl-forfeit', 'ctrl-stand'].forEach((ctrl) => {
        this.ui.getButton(ctrl).disabled = true;
      });

      setTimeout(() => {
        if (dealer.totalCards < 2) {
          this.playerHit();
          this.nextPlayer();
          this.dealAll();
        } else {
          this.current = 0;
          this.nextPlayer();
          this.firstDeal();
        }
      }, 300);
    }

    /**
     * Gets the players' bid input and locks bidding. After all bids are in the round commences.
     */
    placeBids() {
      this.ui.getButton('ctrl-bid').disabled = true;

      if (!this.ui.checkBids()) {
//        let playerCount = this.players.length;


        this.players.forEach((player, i) => {
          // skipping dealer and empty players
          if (player.skip || i === 0) return;

          player.bid = this.ui.getBid(i + 1);
        });


//        for (let i = 1; i < playerCount; i++) {
//          let player = this.players[i];
//          if (!player.skip) player.bid = this.ui.getBid(i);
//        }

        this.dealAll();
      }
    }

    /**
     * Reveals the players first two cards.
     * Also enables the controls for the player's turn
     */
    firstDeal() {
      ['ctrl-hit', 'ctrl-forfeit', 'ctrl-stand'].forEach(ctrl => this.ui.getButton(ctrl).disabled = false);

      const currPlayer = this.players[this.current];
      this.ui.getButton('ctrl-double').disabled = !currPlayer.canDouble();
    }

    /**
     * Reveals the current players card, and updates their score to the player object & UI.
     * If the player reaches 21 points or more, they automatically stand.
     */
    playerHit() {
      const card = this.deck.deal();
      const target = this.current;
      const result = this.players[target].draw(card);

      if (result.endTurn && target > 0) this.playerStand();

      this.ui.hit(target, card, result.scoreStr);
    }

    /**
     * Moves clockwise to the next player on the table.
     * When the round reachs the dealer he plays automatically.
     */
    playerStand() {
      this.nextPlayer();

      if (this.current === 0) {
        this.ui.getButton('ctrl-hit').disabled = true;
        this.ui.getButton('ctrl-stand').disabled = true;
        this.autoPlay();
      } else {
        this.firstDeal();
      }
    }

    /**
     * Doubles the player's bid to draw a single card and end their turn.
     */
    playerDouble() {
      const current = this.current;
      const currPlayer = this.players[current];
      const currOutput = this.ui.playerOutputs[current];
      const card = this.deck.deal();
      const result = currPlayer.draw(card);

      currPlayer.bid *= 2;
      currOutput.bid = currPlayer.bid;

      this.ui.hit(current, card, result.scoreStr);
      this.playerStand();
    }

    /**
     * Forfeits half of the player's bet to stand without winning or losing.
     */
    playerForfeit() {
      const current = this.players[this.current];

      current.money -= current.bid / 2;
      current.bid = 0;

      this.ui.setMoney(this.current, current.money);

      this.playerStand();
    }

    /**
     * Updates to the next player. Automatically skips inactive players. Updates the UI.
     */
    nextPlayer() {
      const current = this.current;
      const players = this.players;

      this.current = (current + 1) % (players.length);

      if (players[this.current].skip || players[this.current].score > 20) {
        return this.nextPlayer();
      }

      this.ui.setActive(this.current);
    }

    /**
     * The dealer's automatic hand. Draws until 17+ and then stands.
     */
    autoPlay() {
      const player = this.players[this.current];

      setTimeout(() => {
        if (player.score < 17) {
          this.playerHit();
          this.autoPlay(player);
        } else {
          this.endRound();
        }
      }, 500);
    }

    /**
     * After the dealer has his turn, all scores are compared and winnings handed out.
     * Players with 0 money are knocked out
     */
    endRound() {
      const dealer = this.players.shift();

      this.players.forEach((player, i) => {
        const money = player.getMoney(dealer.score, dealer.cardCount);

        const j = i + 1; // since skipping dealer need to fix the index

        this.ui.setMoney(j, money);

        if (player.money === 0 && !player.skip) {
          player.skip = true;
          this.ui.knockout(j);
          this.activeCount -= 1;
        }
      });

//      for (let i = 1; i < playerCount; i++) { //skipping dealer
//        let player = this.players[i],
//          money = player.getMoney(dealer.score, dealer.cardCount);
//
//        this.ui.setMoney(i, money);
//
//        if (player.money == 0 && !player.skip) {
//          player.skip = true;
//          this.ui.knockout(i);
//          this.activeCount--;
//        }
//      }

      setTimeout(() => {
        if (this.activeCount === 1) {
          this.endAll();
        } else {
          this.restart();
        }
      }, 2000);
    }

    /**
     * If there are no more players the game is over. GG WP.
     */
    endAll() {
      console.log('game over');
    }

    /**
     * Hooks UI buttons to the core game functions.
     * @returns {Object} gameplay functions
     */
    get gamePlay() {
      return {
        new: opts => this.newGame(opts),
        hit: () => this.playerHit(),
        stand: () => this.playerStand(),
        double: () => this.playerDouble(),
        forfeit: () => this.playerForfeit(),
        menu: () => this.menu.toggleForm(),
        bid: () => this.placeBids(),
      };
    }


  }

  return new BlackJack();
}(document)));
