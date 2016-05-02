"use strict";

var output = document.getElementById('js_output');

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
    var rng = Math.floor(Math.random() * deck.count);
    output = deck.cards.splice(rng,1);

    deck.count--;
    return output[0];
  },

  draw: function(num) {
    var i, output = [];

    for (i = 0; i < num; i++) {
      var rng = Math.floor(Math.random() * deck.count);
      output.concat(deck.cards.splice(rng,1));

      deck.count--;
    }
    return output;
  },

}

var player = {
  score: 0,
  hardAce: true,
  hand: [],
  bet: 0,


  hit: function() {
    var card = deck.drawOne();

    player.score += cardValue(card);
    player.hand.push(card);
    table.addPlayerCard(card);
  },
  stand : function() {
    dealer.play();
  }
}

var dealer = {
  score: 0,
  hardAce: true,
  hand: [],

  hit: function() {
    var card = deck.drawOne();

    dealer.score += cardValue(card);
    dealer.hand.push(card);
    table.addDealerCard(card);

    //table.dealerScoreBoard.textContent = score.check(dealer);
  },

  play: function() {
    dealer.blankRm();
    if (dealer.score < 17) { while (dealer.score < 17) {
      dealer.hit();
    }}
    table.endGame();
  },

  blankAdd: function() {
    var card = document.createElement('div');

    card.className = 'card blank';
    table.dealerHand.appendChild(card);
  },
  blankRm : function() {
    var i, blankCards = table.dealerHand.getElementsByClassName('blank'),
        n = blankCards.length;
    for (i = 0; i < n; i++) {
      table.dealerHand.removeChild(blankCards[i]);
    }


  }
}

var score = {
  check: function(target) {
    var scoreStr = '0';
    var firstScore = target.hand.length < 3;
    var hasAce = target.hand.some(function(val) {
      return val[0] === 0;
    });

    if (firstScore && target.score == 21) {
      scoreStr = 'BlackJack';
      dealer.play();
      //table.win();

    } else if (firstScore && hasAce) {
      scoreStr = 'Soft ' + target.score;
      target.hardAce = false;

    } else if (target.score > 21 && !target.hardAce) {
      target.score = target.score - 10;
      target.hardAce = true;
      scoreStr = target.score;

    } else if (target.score > 21) {
      scoreStr = 'Bust'
      dealer.play();

    } else {
      scoreStr = target.score;
    }
  // console.log(target.hand);
    return scoreStr;
   // table.playerScoreBoard.textContent = scoreStr;
  }
}

var table = {
  init: function(options) {
    var defaults = {
      tableElement : options.tableElement === undefined ? '#jr_cardTable' : options.tableElement,
      deckCount : options.deckCount === undefined ? 6 : options.deckCount
    },
      output = document.querySelector(defaults.tableElement);

    deck.deckCount = defaults.deckCount;
    table.dealerHand = output.getElementsByClassName('dealer-hand')[0];
    table.dealerScoreBoard = output.getElementsByClassName('dealer-score')[0];
    table.playerHand = output.getElementsByClassName('player-hand')[0];
    table.playerScoreBoard = output.getElementsByClassName('player-score')[0];
  },

  newGame: function() {


    player.score = dealer.score = table.dealerScoreBoard.textContent = table.playerScoreBoard.textContent = 0;
    player.hand = [];
    dealer.hand = [];

    [table.dealerHand,table.playerHand].forEach(function(el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    })

    deck.build();

    player.hit();
    dealer.blankAdd();
    player.hit();
    dealer.hit();
  },

  addPlayerCard: function(card) {
    table.playerScoreBoard.textContent = score.check(player);
    table.playerHand.appendChild(cardVisual(card));
  },

  addDealerCard: function(card) {
    table.dealerScoreBoard.textContent = score.check(dealer);
    table.dealerHand.appendChild(cardVisual(card));
  },

  endGame: function() {
    var result;
    if ((player.score > dealer.score || dealer.score > 21) && player.score < 22 ) {
      result = 'player wins'
    } else if (player.score == dealer.score) {
      result = 'push';
    } else {
      result = 'dealer wins'
    }
    console.log(result);
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

function cardVisual(cardArr) {
  var suits = ['diamonds', 'hearts', 'spades', 'clubs'],
    faces = {0 : 'A', 10 : 'J', 11 : 'Q', 12 : 'K'};

  var card = document.createElement('div'),
    cardVal = document.createElement('span'),
    cardDes = document.createElement('div');

  card.className = 'card ' + suits[cardArr[1]];
  cardVal.innerHTML = faces[cardArr[0]] || cardArr[0] + 1;

  card.appendChild(cardVal);
  card.appendChild(cardDes);

  return card;
}

table.init({
  tableElement : '#jr_cardTable',
  deckCount : 1
});

table.newGame();




