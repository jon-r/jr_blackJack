window.addEventListener("ready", (function (doc) {
  "use strict";

  class BlackJack {
    constructor(board) {
      let query = board || '#jr_cardTable';

      this.table = doc.querySelector(query);
      this.current = 1;
      //defined here, but not set until after the menu
      this.options;
      this.players;
      this.ui;
      this.decksCount;
      this.menu = new Menu(this.table, this.gamePlay.new);
    }

    newGame(opts) {
      opts = opts || {};

      this.options = {
        deckCount: opts.deckCount || 6,
        players: ['Dealer'].concat(opts.players || ['player-1'])
      };
      this.players = this.options.players.map(name => new Player(name));
      this.deck = new Deck(this.options.deckCount);
      this.ui = new UI(this);
      this.dealAll();
    }

    restart() {
      this.current = 1;
      this.players.map(player => player.restart());
      this.ui.restart();
      this.dealAll();
    }

    dealAll() {
      let dealer = this.ui.playerOutputs[0];

      this.ui.deal(this.current);

      setTimeout(() => {
        this.nextPlayer();
        if (dealer.cardCount < 2) this.dealAll();
      }, 300);
    }

    endRound() {
      console.log('round over');
    }

    endAll() {
      console.log('game over');
    }

    playerHit() {
      let card = this.deck.deal(),
        result = this.players[this.current].draw(card);

      this.ui.hit(this.current, card, result.scoreStr);

      if (result.endTurn && this.current > 0) this.playerStand();
    }

    playerStand() {
      this.nextPlayer();

      if (this.current == 0) this.autoPlay();
    }

    nextPlayer() {
      let current = this.current,
        players = this.players;

      this.current = (current + 1) % (players.length);
      this.ui.setActive(this.current);
    }

    autoPlay() {
      let player = this.players[this.current];

      setTimeout(() => {
        if (player.score < 17) {
          this.playerHit();
          this.autoPlay(player);
        } else {
          this.endRound();
        }
      }, 500);
    }

    get gamePlay() {
      return {
        new: (opts) => this.newGame(opts),
        hit: () => this.playerHit(),
        stand: () => this.playerStand(),
        restart: () => this.restart()
      };
    }
  }

  class Menu {
    constructor(table,optsFn) {
      this.build(table);
      this.optsFn = optsFn;
    }

    build(table) {
      let form = table.appendChild(newEl('form', {
          class : 'intro-form'
        })),
        rows = new Map([
          ['decks', ['Deck Count', 'number', 6]],
          ['p-1', ['Player 1', 'text', 'Steve']],
          ['p-2', ['Player 2', 'text']],
          ['p-3', ['Player 3', 'text']],
          ['p-4', ['Player 4', 'text']],
          ['p-5', ['Player 5', 'text']],
          ['p-6', ['Player 6', 'text']],
          ['submit', ['Start', 'submit', 'Go']]
        ]);

      for (let [name,arr] of rows) {
        let newLabel = newEl('label', {
            class : `form-label label-${name} label-${arr[1]}`,
            for : `input-${name}`,
            text: arr[0]
          }),
          newInput = newEl('input', {
            class : `form-input input-${name} input-${arr[1]}`,
            name  : name,
            type  : arr[1],
            id    : `input-${name}`,
            value : arr[2] || '',
            min : arr[1] == 'number' ? 1 : ''
          });

        [newLabel,newInput].forEach(el => form.appendChild(el));
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        this.setupGame(e.target.elements);

        form.style.opacity = 0;
      });
    }

    setupGame(inputs) {
      let opts = {
        deckCount :  inputs[0].value,
        players : [],
      };

      for (let i = 1, n = inputs.length - 1; i < n; i++) {
        let val = inputs[i].value;
        if (val !== "") opts.players.push(val);
      }

      this.optsFn(opts);
    }
  }

  class Deck {
    constructor(deckCount) {
      this.cards = [];
      this.count = deckCount;
      this.build();
    }

    build() {
      //decks
      for (let i = 0; i < this.count; i++) {
        //suits
        for (let j = 0; j < 4; j++) {
          //values
          for (let k = 1; k < 14; k++) {
            this.cards.push([k, j]);
          }
        }
      }
    }

    restart() {
      this.cards = [];
      this.build();
    }

    deal() {
      let rng = Math.floor(Math.random() * this.cards.length);
      return this.cards.splice(rng, 1)[0];
    }
  }

  class Player {
    constructor(name) {
      this.name = name;
      this.cardCount = 0;
      this.score = 0;
      this.hand = [];
      this.hardAce = true;
    }

    restart() {
      this.cardCount = 0;
      this.score = 0;
      this.hand = [];
      this.hardAce = true;
    }

    draw(newCard) {
      this.cardCount++;
      this.hand.push(newCard);
      this.score += this.setScore(newCard);

      return this.calculateScore();
    }

    calculateScore() {
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
        scoreStr = this.score = thisScore - 10;
        this.hardAce = true;

      } else if (thisScore > 21) {
        scoreStr = `Bust ${thisScore}`;
        endTurn = true;

      } else {
        scoreStr = thisScore;
      }

      return {scoreStr,endTurn};
    }

    setScore(newCardArr) {
      let value = newCardArr[0];

      return (1 == value) ? 11
        : (10 < value) ? 10
        : value;
    }
  }

  class UI {
    constructor(game) {
      this.table = game.table;
      this.playerOutputs = game.players.map(this.buildPlayers, this);
      this.panel = this.buildPanel();
      this.panel.addEventListener('click', e => {
        let ctrl = e.target.dataset.ctrl;
        if (ctrl) game.gamePlay[ctrl]();
      }, false);
    }

    buildPanel() {
      let panel = newEl('div', {'class' : 'control-box' });

      ['hit', 'stand', 'restart'].forEach(name => {
        const newCtrl = newEl('button', {
          'class' : `ctrl ctrl-${name}`,
          'text' : name,
          'data-ctrl' : name
        });
        panel.appendChild(newCtrl);
      });

      this.table.appendChild(panel);

      return panel;
    }

    buildPlayers(playerObj,index) {
      let parentEl = newEl('div', { 'class' : `player-frame player-${index}` }),
        output = {
          cardCount: 0,
          childEls: {},
          hand: [],
          goX: 0,
          goY: 0
        },
        vals = new Map([
          ['score', '0'],
          ['title', playerObj.name],
          ['hand', '']
        ]);

      for (let [key,val] of vals) {
        let thisEl = newEl('div', {
          'class' : key,
          'text' : val
        });
        parentEl.appendChild(thisEl);
        output.childEls[key] = thisEl;
      }

      this.table.appendChild(parentEl);

      output.goX = this.table.offsetWidth - parentEl.offsetLeft;
      output.goY = -parentEl.offsetTop;

      return output;
    }

    restart() {
      let outputs = this.playerOutputs,
        count = outputs.length;

      for (let i = 0; i < count; i++) {
        let output = outputs[i],
          hand = output.childEls.hand;

        output.hand = [];
        output.cardCount = 0;
        output.childEls.score.textContent = '0';
        while (hand.firstChild) hand.removeChild(hand.firstChild);
      }
    }

    setActive(current) {
      let active = this.playerOutputs[current];

      this.playerOutputs.forEach(player => {
        player.childEls.title.classList.remove('active');
      });

      active.childEls.title.classList.add('active');
    }


    hit(current, card, scoreStr) {
      let active = this.playerOutputs[current],
        nth = active.hand.length;

      active.childEls.score.textContent = scoreStr;

      if (nth < active.cardCount) {

        active.hand.push(card);
        this.reveal(current,nth,card);

      } else {
        delay(() => this.deal(current), 0)
        .delay(() => this.hit(current,card,scoreStr), 200);
      }
    }

    deal(current) {
      let active = this.playerOutputs[current],
        x = active.goX - (active.cardCount * 20),
        y = active.goY,
        newCard = newEl('div', {
          'class': 'card draw blank',
          'style': {
            transform:`translate(${x}px, ${y}px)`
          }
        });

      active.cardCount++;
      active.childEls.hand.appendChild(newCard);

      window.getComputedStyle(newCard).transform;
      newCard.style.transform = '';
    }

    reveal(current,nth,card) {
      let active = this.playerOutputs[current],
        flipped = active.childEls.hand.getElementsByClassName('card')[nth];

      flipped.className = 'card blank';

      delay(() => flipped.style.transform = 'translateY(-80px) rotateX(-90deg)', 0)
      .delay(() => this.setCard(flipped,card),150)
      .delay(() => flipped.style.transform = 'rotateX(0)', 150);
    }

    setCard(card,valueArr) {
      let suits = ['diamonds', 'hearts', 'spades', 'clubs'],
        faces = {1 : 'A', 11 : 'J', 12 : 'Q', 13 : 'K'};

      card.className = `card ${suits[valueArr[1]]}`;
      card.appendChild(newEl('span', {'text': faces[valueArr[0]] || valueArr[0] }));

      return card;
    }
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

  return new BlackJack();

}(document)));

