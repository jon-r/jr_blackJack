"use strict";

var i, j, k;

var game = {
  players: [],
  playerCount: 0,
  currentPlayer: 1,

  init: function (options) {
    options = options || {};
    var config = {
        tableElement : options.hasOwnProperty('tableElement') ? options.tableElement : '#jr_cardTable',
        deckCount : options.hasOwnProperty('deckCount') ? options.deckCount : 6,
        players : options.hasOwnProperty('players') ? options.players : ['player']
      }, control = {
        parent : document.createElement('div'),
      };



    deck.deckCount = config.deckCount;

    config.players.unshift('Dealer');

    game.playerCount = config.players.length;

    table.output = document.querySelector(config.tableElement);


    control.parent.className = 'control-box';
    ['hit', 'stand', 'restart'].forEach(function(name) {
      var newCtrl = document.createElement('button');
      newCtrl.className = 'ctrl ctrl-' + name;
      newCtrl.innerHTML = name;
      newCtrl.addEventListener('click', table[name]);
      control.parent.appendChild(newCtrl);
      control[name] = newCtrl;
    })


    table.output.appendChild(control.parent);
    table.control = control;

    for (i = 0; i < game.playerCount; i++) {


      game.players[i] = new Player(config.players[i]);

      table.players[i] = {};
      table.players[i].cardTop = i == 0 ? '20px' : 'calc(100% - 150px)';

      var newPLayerFrame = document.createElement('div');
      newPLayerFrame.className = 'player-frame player-' + i;

      ['score', 'title', 'hand'].forEach(function (el) {
        var newEl = document.createElement('div');
        newEl.className = el;
        newPLayerFrame.appendChild(newEl);
        table.players[i][el] = newEl;
      });

      table.output.appendChild(newPLayerFrame);
      table.players[i].parent = newPLayerFrame;
    }

    game.newGame();
  },

  newGame: function () {

    deck.build();
    game.currentPlayer = 1;
    //resets the scores and table
    for (i = 0; i < game.playerCount; i++) {
      var tblPlay = table.players[i], player = game.players[i];
      player.restore();
      while (tblPlay.hand.firstChild) {
        tblPlay.hand.removeChild(
          tblPlay.hand.firstChild
        );
      }
      tblPlay.score.innerHTML = 0;
      tblPlay.title.innerHTML = player.name;
    }

    game.dealAll(game.currentPlayer);




  },
  dealAll: function () {
    var players = game.players, currentPlayer = players[game.currentPlayer], dealer = players[0];
    setTimeout(function() {

      currentPlayer.deal();

      game.nextPlayer();

      if (dealer.cardsCount < 2) {
        game.dealAll();
      } else {

      }

    }, 300);
  },

  nextPlayer: function () {
    var current = game.currentPlayer;
    table.players[current].title.classList.remove('active');
    game.currentPlayer = (current == game.playerCount - 1) ? 0 : current + 1;
    table.players[game.currentPlayer].title.classList.add('active');
  }

}

var deck = {

  build: function () {
    //decks


    deck.cards = [];

    for (i = 0; i < deck.deckCount; i++) {
      //suits
      for (j = 0; j < 4; j++) {
        //deck
        for (k = 0; k < 13; k++) {
          deck.cards.push([k, j]);
        }
      }
    }


    deck.count = deck.cards.length;
  },

  drawOne: function() {
    var rng = Math.floor(Math.random() * deck.count),
    output = deck.cards.splice(rng,1);

    deck.count--;
    return output[0];
  }
};

var table = {
  output: {},
  players: [],

  hit: function () {
    game.players[game.currentPlayer].hit();
  },
  stand: function () {
    game.nextPlayer();
    if (game.currentPlayer == 0) {
       game.players[game.currentPlayer].autoPlay();
    }
  },
  restart: function () {
    game.newGame();
  }

}


function Player(name) {

  var out = {

    name: name,

    restore: function () {
      out.score = 0;
      out.hand = [];
      out.cardsCount = 0;
      out.hardAce = true;
    },

    deal: function () {
      var newCard = document.createElement('div'),
        current = table.players[game.currentPlayer],
        frame = current.parent,
        goX = table.output.offsetWidth - frame.offsetLeft - (out.cardsCount * 20),
        goY = frame.offsetTop;

      newCard.className = 'card draw blank';
      current.hand.appendChild(newCard);

      newCard.style.transform = 'translate(' + goX + 'px,-' + goY + 'px)';

      window.getComputedStyle(newCard).transform;

      newCard.style.transform = '';
      console.log(table.output.offsetWidth);
      out.cardsCount++;
    },


    hit: function () {
      var nth = out.hand.length, current = table.players[game.currentPlayer];
      if (nth < out.cardsCount) {
        var card = deck.drawOne();
        out.score += cardValue(card);
        out.hand.push(card);

        var flipped = current.hand.getElementsByClassName('card')[nth],

        flipping = delay(function() {
          flipped.className = 'card blank';
          flipped.style.transform = 'translateY(-80px) rotateX(-90deg)';
        }, 0)
        .delay(function() {
          cardSet(flipped,card);
        },150)
        .delay(function() {
          flipped.style.transform = 'rotateX(0)';

        }, 150);

        current.score.textContent = score.check(this);

      } else {
        var temp = delay(function() {
          out.deal();
        },0)
        .delay(function() {
          out.hit();
        }, 150)
      }
    },

    autoPlay: function () {

      setTimeout(function() {
        if (out.score < 17) {
          out.hit();
          out.autoPlay();
        } else {
        //  game.endGame();
        }
      }, 400)
  },

  };
  return out;
}

var score = {
  check: function (target) {
    var scoreStr = '0', firstScore = target.hand.length < 3,
      hasAce = target.hand.some(function(val) {
        return val[0] === 0;
    });

    if (firstScore && target.score == 21) {
      scoreStr = 'BlackJack ' + target.score;
      game.nextPlayer();
      if (game.currentPlayer == 0) {
        game.players[game.currentPlayer].autoPlay();
      }

      //table.win();

    } else if (firstScore && hasAce) {
      scoreStr = 'Soft ' + target.score;
      target.hardAce = false;

    } else if (target.score == 21) {
      scoreStr = target.score;
      game.nextPlayer();

    } else if (target.score > 21 && !target.hardAce) {
      target.score = target.score - 10;
      target.hardAce = true;
      scoreStr = target.score;

    } else if (target.score > 21) {
      scoreStr = 'Bust ' + target.score;
      game.nextPlayer();
      if (game.currentPlayer == 0) {
        game.players[game.currentPlayer].autoPlay();
      }

    } else {
      scoreStr = target.score;
    }
  // console.log(target.hand);
    return scoreStr;
   // table.playerScoreBoard.textContent = scoreStr;
  }
}


function cardValue(cardArr) {
  var out, value = cardArr[0];
  if (value == 0) {
    out = 11;
  } else if (value > 9) {
    out = 10;
  } else {
    out = value + 1;
  }
  return out;
}

function cardSet(card,valueArr) {
  var suits = ['diamonds', 'hearts', 'spades', 'clubs'],
    faces = {0 : 'A', 10 : 'J', 11 : 'Q', 12 : 'K'};

  var cardVal = document.createElement('span'),
    cardDes = document.createElement('div');

  card.className = 'card ' + suits[valueArr[1]];

  cardVal.innerHTML = faces[valueArr[0]] || valueArr[0] + 1;

  card.appendChild(cardVal);
  card.appendChild(cardDes);

  return card;
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

game.init({
  decks: 6,
  players: [
    'Adam','Beth','Chris','Denise','Edward'
  ]
});
