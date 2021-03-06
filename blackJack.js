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

window.addEventListener("ready", (function (doc) {
  "use strict";

  /** Class blackjack represents the core game controller */
  class BlackJack {

    /**
     * Starts the game by locating the gameboard
     * @param {string} board - query selector to set as the visual game ui.
     */
    constructor(board) {
      const TBL_QUERY = board || '[data-blackjack]';

      this.table = doc.querySelector(TBL_QUERY);
      this.current;
      this.options;
      this.players;
      this.activeCount;
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
      this.players.map((player, idx) => {
        player.restart();
        if (player.skip && idx == this.current) this.current++;
      });
      this.ui.restart();
      //this.dealAll();
      this.ui.getButton('ctrl-bid').disabled = this.ui.checkBids();
    }

    /**
     * Deals the cards to all active players. Loops out until every player has two cards.
     */
    dealAll() {
      let dealer = this.ui.playerOutputs[0];



      this.ui.deal(this.current);



      ['ctrl-double','ctrl-hit','ctrl-forfeit','ctrl-stand']
        .forEach(ctrl => this.ui.getButton(ctrl).disabled = true);

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

        //skipping dealer and empty players
        this.players.slice(1).map((player, i) => {
          if (!player.skip) player.bid = this.ui.getBid(i + 1);
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

      ['ctrl-hit','ctrl-forfeit','ctrl-stand'].forEach(ctrl => this.ui.getButton(ctrl).disabled = false);

      let currPlayer = this.players[this.current];
      this.ui.getButton('ctrl-double').disabled = !currPlayer.canDouble();

    }

    /**
     * Reveals the current players card, and updates their score to the player object & UI.
     * If the player reaches 21 points or more, they automatically stand.
     */
    playerHit() {

      let card = this.deck.deal(),
        target = this.current,
        result = this.players[target].draw(card);

      if (result.endTurn && target > 0) this.playerStand();

      this.ui.hit(target, card, result.scoreStr);

    }

    /**
     * Moves clockwise to the next player on the table. When the round reachs the dealer he plays automatically.
     */
    playerStand() {
      console.log('player stands');
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
     * Doubles the player's bid to draw a single card and end their turn.
     */
    playerDouble() {
      let current = this.current,
        currPlayer = this.players[current],
        currOutput = this.ui.playerOutputs[current],
        card = this.deck.deal(),
        result = currPlayer.draw(card);

      currPlayer.bid *= 2;
      currOutput.bid = currPlayer.bid;

      this.ui.hit(current, card, result.scoreStr);
      this.playerStand();
    }

    /**
     * Forfeits half of the player's bet to stand without winning or losing.
     */
    playerForfeit() {
      let current = this.players[this.current];

      current.money -= current.bid/2;
      current.bid = 0;

      this.ui.setMoney(this.current, current.money);

      this.playerStand();
    }

    /**
     * Updates to the next player. Automatically skips inactive players. Updates the UI.
     */
    nextPlayer() {
      let current = this.current,
        players = this.players;

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
     * Players with 0 money are knocked out
     */
    endRound() {
      let dealer = this.players.shift();

      this.players.map((player, i) => {
        let money = player.getMoney(dealer.score, dealer.cardCount);

        i++; //since skipping dealer need to fix the index

        this.ui.setMoney(i, money);

        if (player.money == 0 && !player.skip) {
          player.skip = true;
          this.ui.knockout(i);
          this.activeCount--;
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
        if (this.activeCount == 1) {
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
        new: (opts) => this.newGame(opts),
        hit: () => this.playerHit(),
        stand: () => this.playerStand(),
        double: () => this.playerDouble(),
        forfeit: () => this.playerForfeit(),
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
      let form = table.parentElement.insertBefore(newEl('form', [
          ['class', 'intro-form']
        ]), table),
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
        let newLabel = newEl('label', [
            ['class', `form-label label-${name} label-${arr[1]}`],
            ['for', `input-${name}`],
            ['text', arr[0]]
          ]),
          newInput = newEl('input', [
            ['class', `form-input input-${name} input-${arr[1]}`],
            ['name', name],
            ['type', arr[1]],
            ['placeholder', arr[0]],
            ['id', `input-${name}`],
            ['value', arr[2] || ''],
            ['min', arr[1] == 'number' ? 1 : '']
          ]);
        [newLabel,newInput].forEach(el => form.appendChild(el));
        if (arr[1] == 'text') {
          let btn = newEl('button', [
            ['class', 'clear-player'],
            ['text', 'X']
          ]);
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.nextElementSibling.value = '';
          });
          form.insertBefore(btn,newInput);
        }
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        this.setupGame();
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
    setupGame() {
      let inputs = getFormData(this.form).map(input => input.value);

      this.optsFn({
        deckCount : inputs.shift(),
        players : inputs.filter(value => value !== "")
      });
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
     * Builds a deck of cards for the dealer to use. Iterates through n = [this.count] decks, 4 suits and 14 cards per suit.
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
     * @returns {object} result - the card score, and if this card forces the player to skip.
     */
    draw(newCard) {
      this.cardCount++;
      this.hand.push(newCard);
      this.score += newCard.score;

      let endTurn = false,
        firstScore = this.cardCount < 3,
        softAce = this.hand.some(card => card.face == 'A'),
        thisScore = this.score;


      if (thisScore > 21 && this.hardAce) {
        return {
          scoreStr: `Bust ${thisScore}`,
          endTurn: true
        };
      }

      if (thisScore > 21 && softAce) {
        this.hardAce = true;
        thisScore = this.score = thisScore - 10;
      }

      if (firstScore && thisScore == 21) {
        thisScore = `BlackJack ${thisScore}`;
      }

      if (softAce && thisScore < 21) {
        this.hardAce = false;
        thisScore = `Soft ${thisScore}`;
      }

      return {scoreStr: thisScore, endTurn};
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
      let panel = newEl('div', [['class', 'control-box' ]]);

      ['bid','hit','stand','double','forfeit','menu']
      .forEach(name => {
        const newCtrl = newEl('button', [
          ['class', `ctrl ctrl-${name}`],
          ['text', name],
          ['data-ctrl', name]
        ]);
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
    buildPlayer(playerObj, idx) {
      let parentEl = newEl('div', [
          ['class',`player-frame player-${idx}`]
        ]),
        output = {
          bid: 500,
          totalCards: 0,
          revealedCards: 0,
          childMap: new Map(),
          goX: 0,
          goY: 0,
          skip: false,
        },
        vals = new Map([
          ['title', ['h3', playerObj.name, true]],
          ['money', ['h5', playerObj.money]],
          ['difference', ['span','0']],
          ['hand', ['div','', true]],
          ['score', ['span', '0', true]],
        ]);

      for (let [key,arr] of vals) {
        if (idx > 0 || arr[2]) {
          let thisEl = newEl(arr[0], [
            ['class', key],
            ['text', arr[1]]
          ]);
          parentEl.appendChild(thisEl);
          output.childMap.set(key,thisEl);
        }
      }

      if (idx > 0) {
        let thisBid = newEl('input', [
          ['type', 'number'],
          ['class', 'playerBet'],
          ['min', Math.min(100,playerObj.money)],
          ['max', playerObj.money],
          ['value', output.bid]
        ]);

        thisBid.addEventListener('change', (e) => {
          let check = this.checkBid(e.target);
          this.getButton('ctrl-bid').disabled = check;
        });
        output.childMap.set('bid',thisBid);
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
          els = output.childMap,
          hand = els.get('hand');

        output.totalCards = 0;
        output.revealedCards = 0;

        while (hand.firstChild) hand.removeChild(hand.firstChild);

        els.get('score').textContent = '';

        if (i > 0) {
          let curMoney = els.get('money').textContent,
            bid = els.get('bid');

          bid.disabled = false;
          setAttributes(bid, [
            ['max', curMoney],
            ['min', Math.min(100,curMoney)]
          ]);

        }
      }
    }

    /**
     * highlights the active player.
     * @param {number} current - index of the current active player
     */
    setActive(current) {
      let active = this.playerOutputs[current];

      this.playerOutputs.forEach(player => {
        player.childMap.get('title').classList.remove('active');
      });

      active.childMap.get('title').classList.add('active');
    }

    /**
     * removes a player from the game
     * @param {number} current - index of the player to be removed
     */
    knockout(current) {
      let active = this.playerOutputs[current];

      active.childMap.get('title').classList.add('inactive');
      active.childMap.get('bid').value = 0;
      active.skip = true;
    }

    /**
     * gets the player submitted bid
     * @param   {number} current - the index of the active player
     * @returns {number} value - the bid amount
     */
    getBid(current) {
      let bidInput = this.playerOutputs[current].childMap.get('bid');

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
     * breaks if any are invalid
     * @returns {boolean} validity check
     */
    checkBids() {
      return this.playerOutputs.slice(1)
        .some(player => !player.skip && this.checkBid( player.childMap.get('bid') ));
    }

    /**
     * updates the player's visual score based on winnings. pings the screen with the difference
     * @param {number} current - target player index
     * @param {number} money   - players new score at the end of the round
     */
    setMoney(current, money) {
      let activeEls = this.playerOutputs[current].childMap,
        moneyDiff = money - activeEls.get('money').textContent,
        diffEl = activeEls.get('difference'),
        diff;

      if (moneyDiff !== 0) {
        diff = moneyDiff > 0 ? 'pos' : 'neg';
        diffEl.textContent = moneyDiff;
        diffEl.classList.add(`show-${diff}`);
        activeEls.get('money').textContent = money;

        setTimeout(() => {
          diffEl.classList.remove(`show-${diff}`);
        }, 5000);
      }
    }

    /**
     * visually adds a card to the player's hand
     * @param {number} current - target player
     */
    deal(current) {
      let active = this.playerOutputs[current],
        x = active.goX - (active.revealedCards * 20),
        y = active.goY,
        newCard = newEl('div', [
          ['class', 'card draw blank'],
          ['style', {transform:`translate(${x}px, ${y}px)`}]
        ]);

      active.totalCards++;
      active.childMap.get('hand').appendChild(newCard);
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
        nth = active.revealedCards;

      active.childMap.get('score').textContent = scoreStr;

      if (nth < active.totalCards) {
        active.revealedCards++;

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
        flipped = active.childMap.get('hand').getElementsByClassName('card')[nth];

      flipped.className = 'card blank';

      delay(() => flipped.style.transform = 'translateY(-80px) rotateX(-90deg)', 0)
      .delay(() => this.setCard(flipped,card),150)
      .delay(() => flipped.style.transform = transformJiggle(10), 150);
    }

    /**
     * updates the card element with the new face values
     * @param {object} flipped - card html element
     * @param {object} cardObj - dealt card object
     */
    setCard(flipped,cardObj) {
      flipped.className = `card ${cardObj.suit}`;
      flipped.appendChild(newEl('span', [['text', cardObj.face]]));
    }

  }

  /* - misc functions ---------------------------------------------------- */


  //nodelist to array
  function nodesArray(nodelist) {
    //to make sure the list isnt empty;
    if (!nodelist) return null;

    return Array.prototype.slice.call(nodelist);
  }

  /**
   * parses a webform and returns entries as an array
   * @param {object} form - the formitself
   * returns {array} key/value pairs
   */
  function getFormData(form) {
    let formInputs = form.getElementsByTagName('input');

    return nodesArray(formInputs)
      .filter(input => input.name != 'submit')
      .map(input => ({name: input.name, value: input.value}));
  }

  /**
   * adds a natural variance to the dealt hands
   * @param {number} scale - The scale of the jiggling
   * @returns {string} the transform property value;
   */
  function transformJiggle(scale) {
    let nudgeX,
      nudgeY,
      rotate;

    [nudgeX,nudgeY,rotate] = [0,0,0].map(() => (Math.random() - 0.5) * scale);

    return `translate(${nudgeX}px,${nudgeY}px) rotate(${rotate}deg)`;
  }

  /**
   * creates a new element object
   * @param   {string} el    - element type
   * @param   {Array}  attrs - element attributes
   * @returns {object} new element in the DOM
   */
  function newEl(el,attrs) {
    let element = doc.createElement(el);

    return setAttributes(element,attrs);
  }

  /**
   * sets attributes of an object
   * http://stackoverflow.com/a/12274886
   * @param   {object} el    - element node
   * @param   {Array}  attrs - element attributes
   * @returns {object} updates element
   */
  function setAttributes(el,attrs) {
    let attrMap = new Map(attrs);

    for (let [attr,val] of attrMap) {
      if ((attr === 'styles' || attr === 'style') && typeof val === 'object') {
        for (let prop in val) {
          el.style[prop] = val[prop];
        }
      } else if (attr === 'text') {
        el.textContent = val;
      } else {
        el.setAttribute(attr, val);
      }
    }

    return el;
  }

  /**
   * chains functions to run in sequence, with preset delay
   * http://stackoverflow.com/a/6921279
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
