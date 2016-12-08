window.addEventListener("ready", (function (doc) {
  "use strict";

  /* - core gameplay ---------------------------------------------------- */


  /** Class blackjack represents the core game controller */
  class BlackJack {

    /**
     * Starts the game by locating the gameboard
     * @param {string} board - query selector to set as the visual game ui.
     */
    constructor(board) {
      let query = board || '[data-blackjack]';

      this.table = doc.querySelector(query);
      this.current = 1;
      this.options;
      this.players;
      this.ui;
      this.decksCount;
      this.menu = new Menu(this.table, this.gamePlay.new);
    }

    /**
     * Empties the board to start a new Game. Creates the players, deck, in game UI, and then starts the gameplay.
     * @param {object} opts - Options usually defined in the startup menu
     *
     */
    newGame(opts) {
      opts = opts || {};
      let table = this.table;

      while (table.firstChild) table.removeChild(table.firstChild);

      this.options = {
        deckCount: opts.deckCount || 6,
        players: ['Dealer'].concat(opts.players || ['player-1'])
      };
      this.players = this.options.players.map(name => new Player(name));
      this.deck = new Deck(this.options.deckCount);
      this.ui = new UI(this);
      this.dealAll();
    }

    /**
     * Clears the board to start a new round without reseting player money or options
     */
    restart() {
      this.current = 1;
      this.players.map((player,idx) => {
        player.restart();
        if (player.money == 0) {
          if (idx == this.current) this.current++;
          player.skip = true;
          this.ui.knockout(idx);
        }
      });
      this.ui.restart();
      this.dealAll();
    }

    /**
     * Deals the cards to all active players. Loops out until every player has two cards.
     */
    dealAll() {
      let dealer = this.ui.playerOutputs[0];

      this.ui.deal(this.current);
      this.ui.getButton('ctrl-hit').disabled = true;
      this.ui.getButton('ctrl-stand').disabled = true;

      setTimeout(() => {
        this.nextPlayer();
        if (dealer.cardCount < 2) {
          this.dealAll();
        } else {
          this.current = 0;
          this.playerHit();

          this.ui.getButton('ctrl-bid').disabled = this.ui.checkBids();

          this.nextPlayer();
        }
      }, 100);
    }

    /**
     * Gets the players' bid input and locks bidding. After all bids are in the round commences.
     */
    placeBids() {
      let playerCount = this.players.length;

      for (let i = 1; i < playerCount; i++) { //skipping dealer
        let player = this.players[i];
        if (!player.skip) player.bid = this.ui.getBid(i);
      }

      this.ui.getButton('ctrl-hit').disabled = false;
      this.ui.getButton('ctrl-stand').disabled = false;
      this.ui.getButton('ctrl-bid').disabled = true;
      this.firstDeal();
    }

    /**
     * Reveals the players first two cards.
     */
    firstDeal() {
      delay(() => this.playerHit(), 500)
        .delay(() => this.playerHit(), 500);
    }

    /**
     * Reveals the current players card, and updates their score to the player object, and visual UI. If the player reaches 21 points or more, they automatically stand.
     */
    playerHit() {
      let card = this.deck.deal(),
        result = this.players[this.current].draw(card);

      this.ui.hit(this.current, card, result.scoreStr);

      if (result.endTurn && this.current > 0) this.playerStand();
    }

    /**
     * Moves clockwise to the next player on the table. When the round reachs the dealer he plays automatically.
     */
    playerStand() {
      this.nextPlayer();

      if (this.current == 0) {
        this.ui.getButton('ctrl-hit').disabled = true;
        this.ui.getButton('ctrl-stand').disabled = true;
        this.autoPlay();
      } else {
        this.firstDeal();
      }
    }

    /**
     * Updates to the next player. Automatically skips inactive players. Updates the UI.
     */
    nextPlayer() {
      let current = this.current,
        players = this.players;

      this.current = (current + 1) % (players.length);

      if (players[this.current].skip) {
        this.nextPlayer();
      } else {
        this.ui.setActive(this.current);
      }
    }

    /**
     * The dealer's automatic hand. Draws until 17+ and then stands.
     */
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

    /**
     * After the dealer has his turn, all scores are compared and winnings handed out.
     */
    endRound() {
      console.log('round over');
      let dealer = this.players[0],
        playerCount = this.players.length;

      console.log(playerCount);

      if (playerCount == 1) {
        this.endAll();
      } else {
        for (let i = 1; i < playerCount; i++) { //skipping dealer
          let player = this.players[i];
          if (!player.skip) {
            let money = player.getMoney(dealer.score, dealer.cardCount);
            this.ui.setMoney(i, money);
          }
        }

        setTimeout(() => this.restart(), 5000);
      }
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
        new: (opts) => this.newGame(opts),
        hit: () => this.playerHit(),
        stand: () => this.playerStand(),
        menu: () => this.menu.toggleForm(),
        bid: () => this.placeBids()
      };
    }


  }

  /** Class Menu represents the pre-game options menu */
  class Menu {
    /**
     * Sets up the user input to start the game
     * @param {oject}    table  - table element
     * @param {function} optsFn - game function to update the settings and start a new game
     */
    constructor(table,optsFn) {
      this.build(table);
      this.form;
      this.optsFn = optsFn;
    }

    /**
     * Creates the user options input.
     * @param {object} table - table element
     */
    build(table) {
      let form = table.parentElement.insertBefore(newEl('form', {
          class : 'intro-form'
        }), table),
        rows = new Map([
          ['decks', ['Deck Count', 'number', 6]],
          ['p-1', ['Player 1', 'text', 'Aaron']],
          ['p-2', ['Player 2', 'text', 'Beth']],
          ['p-3', ['Player 3', 'text', 'Chris']],
          ['p-4', ['Player 4', 'text', 'Denise']],
          ['p-5', ['Player 5', 'text', 'Ethan']],
          ['submit', ['New Game', 'submit', 'Go']]
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
            placeholder : arr[0],
            id    : `input-${name}`,
            value : arr[2] || '',
            min : arr[1] == 'number' ? 1 : ''
          });
        [newLabel,newInput].forEach(el => form.appendChild(el));
        if (arr[1] == 'text') {
          let btn = newEl('button', {
            class: 'clear-player',
            text: 'X'
          });
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.nextElementSibling.value = '';
          });
          form.insertBefore(btn,newInput);
        }
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.setupGame(e.target.elements);
        form.classList.add('inactive');
      });

      this.form = form;
    }

    /**
     * Shows and hides the form during gameplay.
     */
    toggleForm() {
      this.form.classList.toggle('inactive');
    }

    /**
     * parses the options input, and starts the game.
     * @param {Array} inputs - html form inputs
     */
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

  /** class Deck represents the deck of cards */
  class Deck {
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
     * Builds a deck of cards for the dealer to use. Iterates through [this.cards] decks, 4 suits and 14 cards per suit.
     */
    build() {
      for (let i = 0; i < this.count; i++) {
        for (let j = 0; j < 4; j++) {
          for (let k = 1; k < 14; k++) {
            this.cards.push([k, j]);
          }
        }
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
      let rng = Math.floor(Math.random() * this.cards.length),
        cardArr = this.cards.splice(rng, 1)[0],
        _0 = cardArr[0],
        _1 = cardArr[1],
        suits = ['diamonds', 'hearts', 'spades', 'clubs'],
        faces = {1: ['A',11], 11: ['J',10], 12: ['Q',10], 13: ['K',10]},
        card = { suit: suits[_1], face: _0, score: _0 };

      if (cardArr[0] in faces ) {
        card.face = faces[_0][0].charAt(0);
        card.score = faces[_0][1];
      }

      return card;
    }

  }

  /** class Player represents a singple playable user. */
  class Player {
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
     * @returns {object} result - the result of this drawn card to the player.
     */
    draw(newCard) {
      this.cardCount++;
      this.hand.push(newCard);
      this.score += newCard.score;

      let scoreStr = '0',
        endTurn = false,
        firstScore = this.cardCount < 3,
        softAce = this.hand.some(card => card.face == 'A'),
        thisScore = this.score;

      if (firstScore && thisScore == 21) {
        scoreStr = `BlackJack ${thisScore}`;
        endTurn = true;

      } else if (softAce && thisScore < 21) {
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

    /**
     * calculates the betting return to the player
     * @param   {number} dlrScore - the score of the dealer this turn
     * @param   {number} dlrCount - the number of cards the dealer drew
     * @returns {number} money - the round's bettings win
     */
    getMoney(dlrScore, dlrCount) {
      let odds = 2,
        plyrScore = this.score,
        dlrBlackJack = (dlrScore == 21 && dlrCount < 3),
        blackJack = (plyrScore == 21 && this.cardCount < 3);

      if (plyrScore < 22) {
        if (blackJack && !dlrBlackJack) {
          odds = 1.5;
        } else if (plyrScore > dlrScore || dlrScore > 21) {
          odds = 1;
        } else if (blackJack && dlrBlackJack || plyrScore == dlrScore) {
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

  /** class UI represents the in game user interface and visuals */
  class UI {
    /**
     * sets up the UI
     * @param {object} game - the core game object
     */
    constructor(game) {
      this.table = game.table;
      this.playerOutputs = game.players.map(this.buildPlayer, this);
      this.panel = this.buildPanel();
      this.panel.addEventListener('click', e => {
        let ctrl = e.target.dataset.ctrl;
        if (ctrl) game.gamePlay[ctrl]();
      }, false);
    }

    /**
     * creates the in game button controls
     * @returns {object} panel - the game controls html element
     */
    buildPanel() {
      let panel = newEl('div', {'class' : 'control-box' });

      ['bid','hit', 'stand', 'menu'].forEach(name => {
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

    /**
     * targets the buttons in the control panel
     * @param   {string} btnClass - class of target button
     * @returns {object} button html element
     */
    getButton(btnClass) {
      return this.panel.getElementsByClassName(btnClass)[0];
    }

    /**
     * creates a visual representation for a player
     * @param   {object} playerObj - initial player values
     * @param   {number} idx       - index of player in the array of players
     * @returns {object} player    - in game player html element
     */
    buildPlayer(playerObj,idx) {
      let parentEl = newEl('div', {
          'class': `player-frame player-${idx}`
        }),
        output = {
          bid: 500,
          cardCount: 0,
          childEls: {},
          hand: [],
          goX: 0,
          goY: 0,
          skip: false,
        },
        vals = new Map([
          ['score', ['0', true]],
          ['title', [playerObj.name, true]],
          ['money', [playerObj.money]],
          ['difference', ['0']],
          ['hand', ['', true]]
        ]);

      for (let [key,arr] of vals) {
        if (idx > 0 || arr[1]) {
          let thisEl = newEl('div', {
            'class' : key,
            'text' : arr[0]
          });
          parentEl.appendChild(thisEl);
          output.childEls[key] = thisEl;
        }
      }

      if (idx > 0) {
        let thisBid = newEl('input', {
          'type' : 'number',
          'class' : 'playerBet',
          'min' : Math.min(100,playerObj.money),
          'max' : playerObj.money,
          'value' : output.bid
        });

        thisBid.addEventListener('change', (e) => {
          let check = this.checkBid(e.target);
          this.getButton('ctrl-bid').disabled = check;
        });
        output.childEls.bid = thisBid;
        parentEl.appendChild(thisBid);
      }

      this.table.appendChild(parentEl);
      output.goX = this.table.offsetWidth - parentEl.offsetLeft;
      output.goY = -parentEl.offsetTop;

      return output;
    }

    /**
     * resets the visual UI and clears the table for the next round.
     */
    restart() {
      let outputs = this.playerOutputs,
        count = outputs.length;

      for (let i = 0; i < count; i++) {
        let output = outputs[i],
          els = output.childEls,
          hand = els.hand;

        output.hand = [];
        output.cardCount = 0;
        if (i > 0) {
          els.bid.disabled = false;
          els.bid.setAttribute("max",els.money.textContent);
        }
        els.score.textContent = '0';
        while (hand.firstChild) hand.removeChild(hand.firstChild);
      }
    }

    /**
     * highlights the active player.
     * @param {number} current - index of the current active player
     */
    setActive(current) {
      let active = this.playerOutputs[current];

      this.playerOutputs.forEach(player => {
        player.childEls.title.classList.remove('active');
      });

      active.childEls.title.classList.add('active');
    }

    /**
     * removes a player from the game
     * @param {number} current - index of the player to be removed
     */
    knockout(current) {
      let active = this.playerOutputs[current];

      active.childEls.title.classList.add('inactive');
      active.skip = true;

    }

    /**
     * gets the player submitted bid
     * @param   {number} current - the index of the active player
     * @returns {number} value - the bid amount
     */
    getBid(current) {
      let active = this.playerOutputs[current],
        bidInput = active.childEls.bid;

      bidInput.disabled = true;

      return bidInput.value;
    }

    /**
     * validates the players bid, if it is within the biddable range
     * @param   {object}  inputEl - user bid input
     * @returns {boolean} validity check
     */
    checkBid(inputEl) {
      let invalid = !inputEl.validity.valid;
      if (invalid) {
        inputEl.classList.add('invalid');
      } else {
        inputEl.classList.remove('invalid');
      }

      return invalid;
    }

    /**
     * loops the checkbid through all active players.
     * returns validity only if all are valid
     * @returns {boolean} validity check
     */
    checkBids() {
      let out = [];

      this.playerOutputs.forEach((player,idx) => {
        if (!player.skip && idx > 0) {
          out.push(this.checkBid(player.childEls.bid));
        }
      });

      return out.some(bool => bool == true);
    }

    /**
     * updates the player's visual score based on winnings. pings the screen with the difference
     * @param {number} current - target player index
     * @param {number} money   - players new score at the end of the round
     */
    setMoney(current, money) {
      let activeEls = this.playerOutputs[current].childEls,
        moneyDiff = money - activeEls.money.textContent,
        diff;

      if (moneyDiff !== 0) {
        diff = moneyDiff > 0 ? 'pos' : 'neg';
        activeEls.difference.textContent = moneyDiff;
        activeEls.difference.classList.add(`show-${diff}`);
        activeEls.money.textContent = money;

        setTimeout(() => {
          activeEls.difference.classList.remove(`show-${diff}`);
        }, 5000);
      }
    }

    /**
     * visually adds a card to the player's hand
     * @param {number} current - target player
     */
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

    /**
     * visually deals a card to the player and updates their score display
     * @param {number} current  target player index
     * @param {object} card     player's dealt card
     * @param {string} scoreStr players new score display
     */
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

    /**
     * turns over the players card, revealing face value
     * @param {number} current - target player
     * @param {number} nth     - index of card to be revealed
     * @param {object} card    - what the card turns out to be
     */
    reveal(current,nth,card) {
      let active = this.playerOutputs[current],
        flipped = active.childEls.hand.getElementsByClassName('card')[nth];

      flipped.className = 'card blank';

      delay(() => flipped.style.transform = 'translateY(-80px) rotateX(-90deg)', 0)
      .delay(() => this.setCard(flipped,card),150)
      .delay(() => flipped.style.transform = '', 150);
    }

    /**
     * updates the card element with the new face values
     * @param {object} flipped - card html element
     * @param {object} cardObj - dealt card object
     */
    setCard(flipped,cardObj) {
      flipped.className = `card ${cardObj.suit}`;
      flipped.appendChild(newEl('span', {'text': cardObj.face }));
    }

  }


  /* - misc functions ---------------------------------------------------- */

  /**
   * creates a new element object, with predefined attributes
   * http://stackoverflow.com/a/12274886
   * @param   {string} el    - element type
   * @param   {Array}  attrs - element attributes
   * @returns {object} new element in the DOM
   */
  function newEl(el,attrs) {
    let element = doc.createElement(el);

    for (let idx in attrs) {
      if ((idx === 'styles' || idx === 'style') && typeof attrs[idx] === 'object') {
        for (let prop in attrs[idx]) {
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

  /**
   * chains functions to run in sequence, with preset delay
   * @param   {function} fn - function to run
   * @param   {time}     t - delay in ms before performing function
   * @returns {*}         self
   */
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

