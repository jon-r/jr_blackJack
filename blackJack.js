window.addEventListener("ready", (function (doc) {
  "use strict";


  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {
      this.currentPlayer = 1;

      const config = gameSettings(options);

      this.control = {
        parent : doc.createElement('div')
      };

      config.players.unshift('Dealer');

      this.cards = new Deck(config.deckCount);








    }


  }

  //game settings, with defaults
  function gameSettings(opts) {
    return {
      tableElement : opts.hasOwnProperty('tableElement') ? opts.tableElement : '#jr_cardTable',
      deckCount : opts.hasOwnProperty('deckCount') ? opts.deckCount : 6,
      players : opts.hasOwnProperty('players') ? opts.players : ['player']
    };
  }


  /* - deck object -------------------------------------------------------- */
  class Deck {
    constructor(decksCount) {
      this.cards = [];
      let i, j, k;

      //decks
      for (i = 0; i < decksCount; i++) {
        //suits
        for (j = 0; j < 4; j++) {
          //values
          for (k = 1; k < 14; k++) {
            this.cards.push([k,j]);
          }
        }
      }
    }

    //takes a random card out of the deck
    drawOne() {
      let rng = Math.floor(Math.random() * this.cards.length);
      return this.cards.splice(rng,1)[0];
    }
  }



  /* - player object ------------------------------------------------------ */
  class player {
    constructor(id,name) {

    }
  }

  /* - ui object ---------------------------------------------------------- */
  class ui {
    constructor(baseEl) {
      this.table = baseEl;

    }
  }

  /* - score functions ---------------------------------------------------- */


  /* - gameplay functions ------------------------------------------------- */


  return new Game();
}(document)));
