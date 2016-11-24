window.addEventListener("ready", (function (doc) {
  "use strict";


  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {
      this.setConfig(options);

//      console.log(this.config.players);

      //this.control = { parent : doc.createElement('div') };


      this.cards = new Deck(this.config.deckCount);

      //config.players.unshift('Dealer');
      //this.currentPlayer = 1;
      this.players = this.config.players.map((n) => {return new Player(n);});

      this.control = new Ui(this);

      console.log(this.players);

    }

    //game settings, with defaults
    setConfig(opts) {
      opts = opts || {};
      this.config = {
        tableElement : opts.hasOwnProperty('tableElement') ? opts.tableElement : '#jr_cardTable',
        deckCount : opts.hasOwnProperty('deckCount') ? opts.deckCount : 6,
        players : ['Dealer'].concat(
          opts.hasOwnProperty('players') ? opts.players : ['player-1']
        )

      };
    }


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
  class Player {
    constructor(name) {
      this.name = name;
      this.score = 0;
      this.hand = [];
      this.output = {};
      this.hardAce = true;
    }

    setOutput() {
      this.output.title.innerHTML = this.name;
      this.output.score.innerHTML = '0';
    }

  }

  /* - ui object ---------------------------------------------------------- */
  class Ui {
    constructor(game) {
      this.table = doc.querySelector(game.config.tableElement);

      //the control input


      //the outputs for each player
      let outputs = game.players.map(this.setOutputs);

      this.table.appendChild(this.setInput());
      outputs.forEach((el) => {this.table.appendChild(el);});

/*      for (player of game.players) {
        this.
      }*/


    }

    setInput() {
      let input = doc.createElement('div');
      input.className = 'control-box';
      ['hit', 'stand', 'restart'].forEach((name) => {
        var newCtrl = document.createElement('button');
        newCtrl.className = 'ctrl ctrl-' + name;
        newCtrl.innerHTML = name;
        newCtrl.addEventListener('click', gamePlay[name]);
        input.appendChild(newCtrl);
        //control[name] = newCtrl;
      });

      return input;
    }



    setOutputs(playerObj, index) {
      let frame = doc.createElement('div');

      frame.className = `player-frame player-${index}`;
      //frame.style.top = (index == 0) ? '20px' : 'calc(100% - 150px)';
      //out.cardPosY =
      ['score', 'title', 'hand'].forEach((el) => {
        let newEl = document.createElement('div');
        newEl.className = el;
        frame.appendChild(newEl);
        playerObj.output[el] = newEl;
      });

      playerObj.setOutput();

      return frame;
    }
  }


  /* - score functions ---------------------------------------------------- */


  /* - gameplay functions ------------------------------------------------- */

  function gamePlay() {
    let out = {
/*      output: {},
      players: [],*/

      hit: function () {

        //game.players[game.currentPlayer].hit();
      },
      stand: function () {
//        game.nextPlayer();
//        if (game.currentPlayer == 0) {
//           game.players[game.currentPlayer].autoPlay();
//        }
      },
      restart: function () {
//        game.newGame();
      }
    };

    return out;
  }


  return new Game({
    deckCount:1,
    players: [
      'Adam','Beth','Chris','Denise','Edward'
    ]});
}(document)));
