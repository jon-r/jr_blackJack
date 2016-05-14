"use strict";

function player(name) {

  var out = {

    name: name,

    restore: function() {
      out.score = 0;
      out.hand = [];
      out.cardsCount = 0;
    },

    deal: function() {
      var newCard = document.createElement('div'),
        newLeft = (out.cardsCount * 55) + 10;
      newCard.className = 'card blank';
      table[out.name].hand.appendChild(newCard);

      newCard.style.top = '50px';
      newCard.style.left = 'calc(100% - 20px)';
      window.getComputedStyle(newCard).top;
      window.getComputedStyle(newCard).left;
      newCard.style.top = table[out.name].cardTop;
      newCard.style.left = newLeft + 'px';

      out.cardsCount++;
    },

    hit: function() {
      var nth = out.hand.length;
      if (nth < out.cardsCount) {
        var card = deck.drawOne();
        //var cardFace = cardVisual(card);
        out.score += cardValue(card);
        out.hand.push(card);

        var flipped = table[out.name].hand.getElementsByClassName('card')[nth],

        flipping = delay(function() {
          flipped.style.transform = 'rotateY(90deg)';
        }, 0)
        .delay(function() {
          cardSet(flipped,card);
        },100)
        .delay(function() {
          flipped.style.transform = 'rotateY(0)';
        }, 100);

        table[out.name].score.textContent = score.check(this);

      } else {
        out.deal();
        out.hit();
      }
    }
  }
  return out;
}

var deck = {

  build: function () {
    //decks
    var i,j,k;

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
  output : {},
  dealer : {
    cardTop: '20px'
  },
  player : {

    cardTop: 'calc(100% - 90px)'
  }
}


var game = {
  player: {

  },
  dealer: {

  },

  init: function(options) {
    options = options || {};
    var config = {
      tableElement : options.hasOwnProperty('tableElement') ? options.tableElement : '#jr_cardTable',
      deckCount : options.hasOwnProperty('deckCount') ? options.deckCount : 6
    }

    deck.deckCount = config.deckCount;


    table.output = document.querySelector(config.tableElement);

    allPayers.forEach(function (el) {

      game[el] = new player(el);

      ['hand', 'score'].forEach(function (name) {

        table[el][name] = document.createElement('div'),
        table[el][name].className = el + '-' + name;
        table.output.appendChild(table[el][name]);
      })

    })



    game.newGame();
  },

  newGame: function() {
    deck.build();

    allPayers.forEach(function(el) {
      game[el].restore();
    });

    console.log(game.dealer);

    var setup = delay(game.player.hit, 300)
    .delay(game.dealer.hit, 300)
    .delay(game.player.hit, 300)
    .delay(game.dealer.deal, 300);
  }

}

var allPayers = ['dealer', 'player'];

var score = {
  check: function(target) {
    var scoreStr = '0';
    var firstScore = target.hand.length < 3;
    var hasAce = target.hand.some(function(val) {
      return val[0] === 0;
    });

    if (firstScore && target.score == 21) {
      scoreStr = 'BlackJack ' + target.score;
      dealer.autoPlay();
      //table.win();

    } else if (firstScore && hasAce) {
      scoreStr = 'Soft ' + target.score;
      target.hardAce = false;

    } else if (target.score > 21 && !target.hardAce) {
      target.score = target.score - 10;
      target.hardAce = true;
      scoreStr = target.score;

    } else if (target.score > 21) {
      scoreStr = 'Bust ' + target.score;
      dealer.autoPlay();

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

game.init();
