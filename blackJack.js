window.addEventListener("ready", (function (doc) {
  "use strict";


  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {
      this.setConfig(options);


      this.deck = new Deck(this.config.deckCount);

      this.players = this.config.players.map((n) => new Player(n));

      this.control = new Ui(this);
    //  this.linkUi();

      this.newGame();
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

    newGame() {
      this.currentPlayer = 1;
      this.deck.setDeck();
      this.players.map(player => player.reset());

      this.dealAll();
    }

    dealAll() {
      console.log('new game');
      let players = this.players, currentPlayer = players[this.currentPlayer], dealer = players[0];
      setTimeout(() => {

        currentPlayer.deal(this);

        this.nextPlayer();

      //  if (dealer.cardsCount < 2) this.dealAll();

      }, 300);
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
      this.deckCount = decksCount;
      this.setDeck();
    }

    setDeck() {
      let i, j, k;

      this.cards = [];

      //decks
      for (i = 0; i < this.deckCount; i++) {
        //suits
        for (j = 0; j < 4; j++) {
          //values
          for (k = 1; k < 14; k++) {
            this.cards.push([k, j]);
          }
        }
      }

    }

    //takes a random card out of the deck
    drawOne() {
      let rng = Math.floor(Math.random() * this.cards.length);
      return this.cards.splice(rng, 1)[0];
    }
  }



  /* - player object ------------------------------------------------------ */
  class Player {
    constructor(name) {
      this.name = name;
      this.reset();

      this.output = {};
    }

    reset() {

      this.score = 0;
      this.hand = [];
      this.hardAce = true;

      let ui = this.output;

      if (ui) {
        ui.score.innerHTML = '0';
        while (ui.hand.firstChild) {
          ui.hand.removeChild(
            ui.hand.firstChild
          );
        }
      }
    }

    setOutput() {
      this.output.title.innerHTML = this.name;
      this.output.score.innerHTML = '0';

    }

    deal(game) {
      let newCard = doc.createElement('div'),
        table = game.control.table,
        hand = this.output.hand,
        goX = table.offsetWidth - hand.offsetLeft - (hand.length * 20),
        goY = hand.offsetTop;
       // goX = table.
      //  goX = table.control.parent
      //  goX = game.control .output.offsetWidth - frame.offsetLeft - (out.cardsCount * 20),
    //    goY = frame.offsetTop;
    }

    hit(game) {
      let newCard = game.deck.drawOne(),
        result;
      this.hand.push(newCard);

      this.score += cardValue(newCard);

      result = this.getScore();

      this.output.score.innerHTML = result.scoreStr;

      if (result.endTurn) gamePlay.stand(game);

    }

    getScore() {
      let scoreStr = '0',
        endTurn = false,
        firstScore = this.hand.length < 3,
        hasAce = this.hand.some((val) => val === 0),
        thisScore = this.score;

      if (firstScore && thisScore == 21) {

        scoreStr = `BlackJack ${thisScore}`;
        endTurn = true;

      } else if (firstScore && hasAce) {

        scoreStr = `Soft ${thisScore}`;
        this.hardAce = false;

      } else if (thisScore == 21) {

        scoreStr = thisScore;
        endTurn = true;

      } else if (thisScore > 21 && !this.hardAce) {
        this.score = thisScore - 10;

        this.hardAce = true;
        scoreStr = thisScore;

      } else if (thisScore > 21) {
        scoreStr = `Bust ${thisScore}`;
        endTurn = true;

      } else {
        scoreStr = thisScore;
      }

      //this.output.score.innerHTML = scoreStr;
      return {scoreStr,endTurn};
    }

  }

  /* - ui object ---------------------------------------------------------- */



  class Ui {
    constructor(game) {
      this.table = doc.querySelector(game.config.tableElement);

      //the control input
      let input = this.setInput();

      input.addEventListener('click', (e) => {
        let ctrl = e.target.dataset.ctrl;
        if (ctrl) gamePlay[ctrl](game);
      }, false);

      //the outputs for each player
      let outputs = game.players.map(this.setOutputs);

      outputs.concat([input]).forEach((el) => this.table.appendChild(el));


    }




    setInput() {
      let input = doc.createElement('div');
      input.className = 'control-box';
      ['hit', 'stand', 'restart'].forEach((name) => {
        var newCtrl = document.createElement('button');
        newCtrl.className = 'ctrl ctrl-' + name;
        newCtrl.innerHTML = name;
        newCtrl.dataset.ctrl = name;
        input.appendChild(newCtrl);
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

  const gamePlay = {

    //out = {
    hit: function (game) {
      game.players[game.currentPlayer].hit(game);
    },
    stand: function (game) {
      game.nextPlayer();
      console.log(game.currentPlayer);
    },
    restart: function (game) {
      game.newGame();
    }
      // };
      //return out;
  };

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
    deckCount: 1,
    players: [
      'Adam', 'Beth', 'Chris', 'Denise', 'Edward'
    ]
  });
}(document)));
