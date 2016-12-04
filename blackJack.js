window.addEventListener("ready", (function (doc) {
  "use strict";

  class BlackJack {
    constructor(options) {
      this.config = this.setConfig(options);
      this.menu = this.setMenu();
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

    setMenu() {
      let table = doc.querySelector(this.config.tableElement),
        form = table.appendChild(newEl('form', {
          'class' : 'intro-form'
        }));

      let rows = new Map([
        ['decks', ['Deck Count', 'number']],
        ['p-1', ['Player 1', 'text']],
        ['p-2', ['Player 2', 'text']],
        ['p-3', ['Player 3', 'text']],
        ['p-4', ['Player 4', 'text']],
        ['p-5', ['Player 5', 'text']],
        ['p-6', ['Player 6', 'text']],
        ['submit', ['Start', 'submit']]
      ]);

      for (let [name,arr] of rows) {
        let row = newEl('p', {
            class : `form-row row-${name}`
          }),
          newLabel = newEl('label', {
            'for' : `input-${name}`,
            'text': arr[0]
          }),
          newInput = newEl('input', {
            'name'  : name,
            'type'  : arr[1],
            'id'    : `input-${name}`
          });

        [newLabel,newInput].forEach(el => row.appendChild(el));
        form.appendChild(row);
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let inputs = e.target.elements,
          decks = Math.min(inputs[0].value, 1),
          nameArr = [];

        for (let i = 1, n = inputs.length - 1; i < n; i++) {
          let val = inputs[i].value;
          if (val !== "") nameArr.push(val);
        }

        return new Game({
          tableElement: this.config.tableElement,
          deckCount: decks,
          players: nameArr
        });
      });

    }

  }

  /* - game object -------------------------------------------------------- */
  class Game {

    constructor(options) {

      this.config = this.setConfig(options);
      this.currentPlayer = 1;
      this.deck = new Deck(this.config.deckCount);
      this.players = this.config.players.map((n) => new Player(n));
      //this.gamePlay = this.gamePlay();
      this.control = this.setUi();

      this.dealAll();
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

    setUi() {
      let table = doc.querySelector(this.config.tableElement);

      //the in game control panel
      let panel = this.setPanel();

      panel.addEventListener('click', (e) => {
        let ctrl = e.target.dataset.ctrl;
        if (ctrl) this.gamePlay[ctrl](this);
      }, false);

      //the outputs for each player
      let outputs = this.players.map(this.setOutputs);

      outputs.concat([panel]).forEach(el => table.appendChild(el));

      return table;
    }

    setPanel() {
      let panel = newEl('div', {'class' : 'control-box' });

      ['hit', 'stand', 'restart'].forEach(name => {
        const newCtrl = newEl('button', {
          'class' : `ctrl ctrl-${name}`,
          'text' : name,
          'data-ctrl' : name
        });
        panel.appendChild(newCtrl);
      });

      return panel;
    }

    setOutputs(playerObj, index) {
     // let frame = doc.createElement('div');
      let frame = newEl('div', { 'class' : `player-frame player-${index}` }),
        vals = new Map([
          ['score', '0'],
          ['title', playerObj.name],
          ['hand', '']
        ]);

      playerObj.output.frame = frame;

      for (let [key,val] of vals) {
        let thisEl = newEl('div', {
          'class' : key,
          'text' : val
        });
        frame.appendChild(thisEl);
        playerObj.output[key] = thisEl;
      }

      return frame;
    }

    get gamePlay() {

      let players = this.players,
        out = {

        hit: () => {
          players[this.currentPlayer].hit(this);
        },

        stand: () => {
          this.nextPlayer();
          if (this.currentPlayer == 0) players[this.currentPlayer].autoPlay(this);
        },
        restart: () => {
          this.currentPlayer = 1;
          this.deck.setDeck();
          players.map(player => player.reset());
          this.dealAll();
        }
      };

      return out;
    }

    dealAll() {
      let players = this.players,
        currentPlayer = players[this.currentPlayer],
        dealer = players[0];

      currentPlayer.deal(this);

      setTimeout(() => {

        this.nextPlayer();

        if (dealer.cardCount < 2) this.dealAll();

      }, 300);
    }

    nextPlayer() {
      let current = this.currentPlayer,
        players = this.players;
      players[current].output.title.classList.remove('active');

      this.currentPlayer = (current + 1) % (players.length);

      players[this.currentPlayer].output.title.classList.add('active');
    }

  }

  /* - deck object -------------------------------------------------------- */
  class Deck {
    constructor(decksCount) {
      this.deckCount = decksCount;
      this.setDeck();
    }

    setDeck() {
      this.cards = [];

      //decks
      for (let i = 0; i < this.deckCount; i++)
        //suits
        for (let j = 0; j < 4; j++)
          //values
          for (let k = 1; k < 14; k++)
            this.cards.push([k, j]);
         // }
        //}
    //  }
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

      ui.score.textContent = '0';
      while (ui.hand.firstChild) {
        ui.hand.removeChild(
          ui.hand.firstChild
        );
      }
    }

    deal(game) {
      let frame = this.output.frame,
        goX = game.control.offsetWidth - frame.offsetLeft - (this.cardCount * 20),
        goY = frame.offsetTop * -1,
        newCard = newEl('div', {
          'class': 'card draw blank',
          'style': {
            transform:`translate(${goX}px, ${goY}px)`
          }
        });

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

        this.output.score.textContent = result.scoreStr;

        if (result.endTurn) game.gamePlay.stand(game);
      } else {
        delay(() => this.deal(game), 0)
        .delay(() => this.hit(game), 200);

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
      }, 500);
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
        thisScore = this.score = thisScore - 10;

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

  /* - card functions ---------------------------------------------------- */
  function cardValue(cardArr) {
    let value = cardArr[0];

    return (1 == value) ? 11
      : (10 < value) ? 10
      : value;
  }

  function cardSet(card,valueArr) {
    let suits = ['diamonds', 'hearts', 'spades', 'clubs'],
      faces = {1 : 'A', 11 : 'J', 12 : 'Q', 13 : 'K'};

    card.className = `card ${suits[valueArr[1]]}`;

    card.appendChild(newEl('span', {'text': faces[valueArr[0]] || valueArr[0] }));
    return card;
  }

  /* - misc functions ---------------------------------------------------- */

  //http://stackoverflow.com/a/12274886
  function newEl(el,attrs) {
    let element = doc.createElement(el);

    for (var idx in attrs) {
      if ((idx === 'styles' || idx === 'style') && typeof attrs[idx] === 'object') {
        for (var prop in attrs[idx]) {
          element.style[prop] = attrs[idx][prop];
        }
      } else if (idx === 'text') {
        element.textContent = attrs[idx];
      } else {
        element.setAttribute(idx, attrs[idx]);
      }
    }

    return element;
  }

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

  return new BlackJack({
    deckCount: 6,
    players: [
      'Aaron', 'Beth', 'Chris', 'Denise', 'Ethan'
    ]
  });
}(document)));
