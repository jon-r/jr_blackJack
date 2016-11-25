window.addEventListener("ready", (function (doc) {
  "use strict";


  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {
      this.setConfig(options);


      this.deck = new Deck(this.config.deckCount);
      this.currentPlayer = 1;
      this.players = this.config.players.map((n) => {
        return new Player(n);
      });

      this.control = new Ui(this);
    }

    //game settings, with defaults
    setConfig(opts) {
      opts = opts || {};
      this.config = {
        tableElement: opts.hasOwnProperty('tableElement') ? opts.tableElement : '#jr_cardTable',
        deckCount: opts.hasOwnProperty('deckCount') ? opts.deckCount : 6,
        players: ['Dealer'].concat(
          opts.hasOwnProperty('players') ? opts.players : ['player-1']
        )

      };
    }

    nextPlayer() {
      let current = this.currentPlayer;
      this.players[current].output.title.classList.remove('active');

      this.currentPlayer = (current == this.players.length - 1) ? 0 : current + 1;
      this.players[this.currentPlayer].output.title.classList.add('active');
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

    hit(deck) {
      let newCard = deck.drawOne();
      this.hand.push(newCard);

      this.score += cardValue(newCard);
      this.output.score.innerHTML = this.getScore();

      this.getScore();
    }

    getScore() {
      let scoreStr = '0',
        firstScore = this.hand.length < 3,
        hasAce = this.hand.some((val) => val === 0),
        thisScore = this.score;

      if (firstScore && thisScore == 21) {

        scoreStr = `BlackJack ${thisScore}`;
        //nextPlayer

      } else if (firstScore && hasAce) {

        scoreStr = `Soft ${thisScore}`;
        this.hardAce = false;

      } else if (thisScore == 21) {

        scoreStr = thisScore;
        //nextPlayer

      } else if (thisScore > 21 && !this.hardAce) {
        this.score = thisScore - 10;

        this.hardAce = true;
        scoreStr = thisScore;

      } else if (thisScore > 21) {
        scoreStr = `Bust ${thisScore}`;
        //nextPlayer
      } else {
        scoreStr = thisScore;
      }

      this.output.score.innerHTML = scoreStr;
    }

  }

  /* - ui object ---------------------------------------------------------- */



  class Ui {
    constructor(game) {
      this.table = doc.querySelector(game.config.tableElement);

      //the control input
      let input = this.setInput(game);

      //the outputs for each player
      let outputs = game.players.map(this.setOutputs);

      outputs.concat([input]).forEach((el) => {this.table.appendChild(el);});

      this.gamePlay = this.setGamePlay();

    }

    setInput(game) {
      let input = doc.createElement('div');
      input.className = 'control-box';
      ['hit', 'stand', 'restart'].forEach((name) => {
        var newCtrl = document.createElement('button');
        newCtrl.className = 'ctrl ctrl-' + name;
        newCtrl.innerHTML = name;
        newCtrl.addEventListener('click', () => {
          this.gamePlay[name](game);
        });
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


    setGamePlay() {
      return {
        hit(game) {
          game.players[game.currentPlayer].hit(game.deck);
        },
        stand(game) {
          game.nextPlayer();
          console.log(game.currentPlayer);
        },
        restart() {

        }
      };
    }

  }


  /* - score functions ---------------------------------------------------- */
  function cardValue(cardArr) {
    let out, value = cardArr[0];
    if (value == 1) {
      out = 11;
    } else if (value > 10) {
      out = 10;
    } else {
      out = value;
    }
    return out;
  }



  /* - gameplay functions ------------------------------------------------- */

  //http://stackoverflow.com/a/6921279
  function delay(fn, t) {
    // private instance variables
    var queue = [],
      self, timer;

    function schedule(fn, t) {
      timer = setTimeout(function () {
        timer = null;
        fn();
        if (queue.length) {
          var item = queue.shift();
          schedule(item.fn, item.t);
        }
      }, t);
    }
    self = {
      delay: function (fn, t) {
        // if already queuing things or running a timer,
        //   then just add to the queue
        if (queue.length || timer) {
          queue.push({
            fn: fn,
            t: t
          });
        } else {
          // no queue or timer yet, so schedule the timer
          schedule(fn, t);
        }
        return self;
      },
      cancel: function () {
        clearTimeout(timer);
        queue = [];
      }
    };
    return self.delay(fn, t);
  }



  return new Game({
    deckCount:1,
    players: [
      'Adam','Beth','Chris','Denise','Edward'
    ]});
}(document)));
