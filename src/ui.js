import { setAttributes, delay, transformJiggle, CustomEl } from './utils';

/** class UI represents the in game user interface and visuals */
export default class UI {
  /**
   * sets up the UI
   * @param {object} game - the core game object
   */
  constructor(game) {
    this.table = game.table;
    this.playerOutputs = game.players.map(this.buildPlayer, this);
    this.panel = this.buildPanel();
    this.panel.addEventListener('click', (e) => {
      const ctrl = e.target.dataset.ctrl;
      if (ctrl) game.gamePlay[ctrl]();
    }, false);
  }

  /**
   * creates the in game button controls
   * @returns {object} panel - the game controls html element
   */
  buildPanel() {
    const panel = new CustomEl('div', { class: 'control-box' });

    ['bid', 'hit', 'stand', 'double', 'forfeit', 'menu']
    .forEach((name) => {
      const newCtrl = new CustomEl('button', {
        class: `ctrl ctrl-${name}`,
        text: name,
        'data-ctrl': name,
      });
      panel.el.appendChild(newCtrl.el);
    });

    this.table.appendChild(panel.el);

    return panel.el;
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
    const isDealer = idx === 0;
    const parentEl = new CustomEl('div', {class: `player-frame player-${idx}`});
    const output = {
      bid: 500,
      totalCards: 0,
      revealedCards: 0,
      childMap: new Map(),
      goX: 0,
      goY: 0,
      skip: false,
    };
//    const vals = new Map([
//      ['title', ['h3', playerObj.name, true]],
//      ['money', ['h5', playerObj.money]],
//      ['difference', ['span', '0']],
//      ['hand', ['div', '', true]],
//      ['score', ['span', '0', true]],
//    ]);
    const els = {
      title: ['h3', playerObj.name, true],
      money: ['h5', playerObj.money],
      difference: ['span', '0'],
      hand: ['div', '', true],
      score: ['span', '0', true],
    };

    Object.keys(els).forEach((el) => {
      const tag = arr[0];
      const text = arr[1];
      const skipDealer = arr[2]
      if (isDealer && skipDealer) return;

      const thisEl =
    })

    vals.forEach(([key, arr]) => {
      if (idx > 0 || arr[2]) {
        const thisEl = newEl(arr[0], [
          ['class', key],
          ['text', arr[1]],
        ]);
        parentEl.appendChild(thisEl);
        output.childMap.set(key, thisEl);
      }
    });

    if (idx > 0) {
      const thisBid = newEl('input', [
        ['type', 'number'],
        ['class', 'playerBet'],
        ['min', Math.min(100, playerObj.money)],
        ['max', playerObj.money],
        ['value', output.bid],
      ]);

      thisBid.addEventListener('change', (e) => {
        const check = this.checkBid(e.target);
        this.getButton('ctrl-bid').disabled = check;
      });
      output.childMap.set('bid', thisBid);
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
    const outputs = this.playerOutputs;

    outputs.forEach((output, i) => {
      const els = output.childMap;
      const hand = els.get('hand');

      output.totalCards = 0;
      output.revealedCards = 0;

      while (hand.firstChild) hand.removeChild(hand.firstChild);

      els.get('score').textContent = '';

      if (i > 0) {
        const curMoney = els.get('money').textContent;
        const bid = els.get('bid');

        bid.disabled = false;
        setAttributes(bid, [
          ['max', curMoney],
          ['min', Math.min(100, curMoney)],
        ]);
      }
    });
  }

  /**
   * highlights the active player.
   * @param {number} current - index of the current active player
   */
  setActive(current) {
    const active = this.playerOutputs[current];

    this.playerOutputs.forEach((player) => {
      player.childMap.get('title').classList.remove('active');
    });

    active.childMap.get('title').classList.add('active');
  }

  /**
   * removes a player from the game
   * @param {number} current - index of the player to be removed
   */
  knockout(current) {
    const active = this.playerOutputs[current];

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
    const bidInput = this.playerOutputs[current].childMap.get('bid');

    bidInput.disabled = true;

    return bidInput.value;
  }

  /**
   * validates the players bid, if it is within the biddable range
   * @param   {object}  inputEl - user bid input
   * @returns {boolean} validity check
   */
  checkBid(inputEl) {
    const invalid = !inputEl.validity.valid;
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
    const outputs = this.playerOutputs.slice(1);
    return outputs
      .some(player => !player.skip && this.checkBid(player.childMap.get('bid')));
  }

  /**
   * updates the player's visual score based on winnings. pings the screen with the difference
   * @param {number} current - target player index
   * @param {number} money   - players new score at the end of the round
   */
  setMoney(current, money) {
    const activeEls = this.playerOutputs[current].childMap;
    const moneyDiff = money - activeEls.get('money').textContent;
    const diffEl = activeEls.get('difference');

    if (moneyDiff !== 0) {
      const diff = moneyDiff > 0 ? 'pos' : 'neg';
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
    const active = this.playerOutputs[current];
    const x = active.goX - (active.revealedCards * 20);
    const y = active.goY;
    const newCard = newEl('div', [
      ['class', 'card draw blank'],
      ['style', { transform: `translate(${x}px, ${y}px)` }],
    ]);

    active.totalCards += 1;
    active.childMap.get('hand').appendChild(newCard);
//    window.getComputedStyle(newCard).transform;
    setTimeout(() => newCard.style.transform = '', 50);
  }

  /**
   * visually deals a card to the player and updates their score display
   * @param {number} current  target player index
   * @param {object} card     player's dealt card
   * @param {string} scoreStr players new score display
   */
  hit(current, card, scoreStr) {
    const active = this.playerOutputs[current];
    const nth = active.revealedCards;

    active.childMap.get('score').textContent = scoreStr;

    if (nth < active.totalCards) {
      active.revealedCards += 1;

      this.reveal(current, nth, card);
    } else {
      delay(() => this.deal(current), 0)
      .delay(() => this.hit(current, card, scoreStr), 200);
    }
  }

  /**
   * turns over the players card, revealing face value
   * @param {number} current - target player
   * @param {number} nth     - index of card to be revealed
   * @param {object} card    - what the card turns out to be
   */
  reveal(current, nth, card) {
    const active = this.playerOutputs[current];
    const flipped = active.childMap.get('hand').getElementsByClassName('card')[nth];

    flipped.className = 'card blank';

    delay(() => flipped.style.transform = 'translateY(-80px) rotateX(-90deg)', 0)
    .delay(() => this.setCard(flipped, card), 150)
    .delay(() => flipped.style.transform = transformJiggle(10), 150);
  }

  /**
   * updates the card element with the new face values
   * @param {object} flipped - card html element
   * @param {object} cardObj - dealt card object
   */
  setCard(flipped, cardObj) {
    flipped.className = `card ${cardObj.suit}`;
    flipped.appendChild(newEl('span', [['text', cardObj.face]]));
  }

}
