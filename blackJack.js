window.addEventListener("ready", (function (doc) {
  "use strict";

  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {
      this.config = this.setConfig(options);
      this.currentPlayer = 1;
      this.deck = new Deck(this.config.deckCount);
      this.players = this.config.players.map((n) => new Player(n));
      this.control = new Ui(this);

      this.newGame();
    }

    //game settings, with defaults
    setConfig(opts) {
      opts = opts || {};
      return {
        tableElement: opts.tableElement || '#jr_cardTable',
        deckCount: opts.deckCount || 6,
        players: ['Dealer'].concat(opts.players || ['player-1'])
      };
    }

    newGame() {
      this.currentPlayer = 1;
      this.deck.setDeck();
      this.players.map(player => player.reset());

      this.dealAll();
    }

    dealAll() {
      //console.log('new game');
      let players = this.players,
        currentPlayer = players[this.currentPlayer],
        dealer = players[0];

      setTimeout(() => {

        currentPlayer.deal(this);

        this.nextPlayer();

        if (dealer.cardCount < 2) this.dealAll();

      }, 100);
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
      this.cards = [];
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
      this.cardCount = 0;
      this.score = 0;
      this.hand = [];
      this.hardAce = true;
      this.output = {hand: null, score: '0', title: ''};
    }

    reset() {
      this.cardCount = 0;
      this.score = 0;
      this.hand = [];
      this.hardAce = true;

      let ui = this.output;

      ui.score.innerHTML = '0';
      while (ui.hand.firstChild) {
        ui.hand.removeChild(
          ui.hand.firstChild
        );
      }
    }

    deal(game) {
      let newCard = doc.createElement('div'),
        frame = this.output.frame,
        goX = game.control.table.offsetWidth - frame.offsetLeft - (this.cardCount * 20),
        goY = frame.offsetTop * -1;

      newCard.className = 'card draw blank';

      newCard.style.transform = `translate(${goX}px, ${goY}px)`;

      this.output.hand.appendChild(newCard);
      this.cardCount++;

      window.getComputedStyle(newCard).transform;
      newCard.style.transform = '';

    }

    hit(game) {
      let nth = this.hand.length;

      if (nth < this.cardCount) {

        let newCard = game.deck.drawOne(),
          result;

        this.hand.push(newCard);
        this.revealCard(nth, newCard);
        this.score += cardValue(newCard);

        result = this.getScore();

        this.output.score.innerHTML = result.scoreStr;

        if (result.endTurn) gamePlay.stand(game);
      } else {
        delay(() => this.deal(game), 0)
        .delay(() => this.hit(game), 150);

      }

    }

    revealCard(nth,card) {
      let flipped = this.output.hand.getElementsByClassName('card')[nth];

      flipped.className = 'card blank';

      delay(() => flipped.style.transform = 'translateY(-80px) rotateX(-90deg)', 0)
      .delay(() => cardSet(flipped,card),150)
      .delay(() => flipped.style.transform = 'rotateX(0)', 150);
    }

    autoPlay(game) {
      setTimeout(() => {
        if (this.score < 17) {
          this.hit(game);
          this.autoPlay(game);
        } else {
        //  game.endGame();
        }
      }, 400);
    }

    getScore() {
      let scoreStr = '0',
        endTurn = false,
        firstScore = this.cardCount < 3,
        hasAce = this.hand.some(val => val[0] === 1),
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

      return {scoreStr,endTurn};
    }

  }

  /* - ui object ---------------------------------------------------------- */

  class Ui {
    constructor(game) {
      this.table = doc.querySelector(game.config.tableElement);

      //the control input
      let input = this.setInput();

      input.addEventListener('click', e => {
        let ctrl = e.target.dataset.ctrl;
        if (ctrl) gamePlay[ctrl](game);
      }, false);

      //the outputs for each player
      let outputs = game.players.map(this.setOutputs);

      outputs.concat([input]).forEach(el => this.table.appendChild(el));

    }

    setInput() {
      let input = doc.createElement('div');

      input.className = 'control-box';

      ['hit', 'stand', 'restart'].forEach(name => {
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
      playerObj.output.frame = frame;

      ['score', 'title', 'hand'].forEach(el => {
        let newEl = document.createElement('div');
        newEl.className = el;
        frame.appendChild(newEl);
        playerObj.output[el] = newEl;
      });

      playerObj.output.title.innerHTML = playerObj.name;
      playerObj.output.score.innerHTML = '0';

      return frame;
    }

  }

  /* - gameplay functions ------------------------------------------------- */

  const gamePlay = {
    hit: function (game) {
      game.players[game.currentPlayer].hit(game);
    },
    stand: function (game) {
      game.nextPlayer();
      if (game.currentPlayer == 0) game.players[game.currentPlayer].autoPlay(game);
    },
    restart: function (game) {
      game.newGame();
    }
  };

  /* - card functions ---------------------------------------------------- */
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

  function cardSet(card,valueArr) {
    let suits = ['diamonds', 'hearts', 'spades', 'clubs'],
      faces = {1 : 'A', 11 : 'J', 12 : 'Q', 13 : 'K'},
      cardVal = document.createElement('span'),
      cardDes = document.createElement('div');

    card.className = `card ${suits[valueArr[1]]}`;

    cardVal.innerHTML = faces[valueArr[0]] || valueArr[0];

    card.appendChild(cardVal);
    card.appendChild(cardDes);

    return card;
  }

  /* - timing functions ---------------------------------------------------- */

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
    deckCount: 6,
    players: [
      'Adam', 'Beth', 'Chris', 'Denise', 'Edward'
    ]
  });
}(document)));
