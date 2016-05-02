"use strict";

var output = document.getElementById('js_output');

var deck = {
  count: 0,
  cards: [],
  table: '',


  build: function (deckCount) {
    //decks
    var i,j,k;

    for (i = 0; i < deckCount; i++) {
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

  draw: function(num) {
    var i, output = [];

    for (i = 0; i < num; i++) {
      var rng = Math.floor(Math.random() * deck.count);
      output = output.concat(deck.cards.splice(rng,1));

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
  firstDraw: function() {
    player.hand = deck.draw(2);

    player.hand.forEach( function(card) {
      player.score += cardValue(card);
      table.addPlayerCard(card);
    });

    player.checkScore(true);
  },

  hit: function() {
    player.hand = deck.draw(1);
    var card = player.hand[0];

    player.score += cardValue(card);
    table.addPlayerCard(card);

    player.checkScore(false);
  },

  checkScore: function(isFirst) {
    var scoreStr = '0';
    var firstScore = isFirst || false;
    var hasAce = player.hand.some(function(val) {
      return val[0] === 0;
    });

    if (firstScore && hasAce && player.score == 21) {
      scoreStr = 'BlackJack';
      //table.win();

    } else if (firstScore && hasAce) {
      scoreStr = 'Soft ' + player.score;
      player.hardAce = false;

    } else if (player.score > 21 && !player.hardAce) {
      player.score = player.score - 10;
      player.hardAce = true;
      scoreStr = player.score;

    } else if (player.score > 21) {
      scoreStr = 'Break'
      //table.lose();

    } else {
      scoreStr = player.score;
    }
    console.log(scoreStr);
    table.playerScoreBoard.textContent = scoreStr;
  }

}

var dealer = {
  score: 0,
  cards: []
}

var table = {


  newGame: function(options) {
    var defaults = {
      tableElement : options.tableElement === undefined ? '#jr_cardTable' : options.tableElement,
      deckCount : options.deckCount === undefined ? 6 : options.deckCount
    },
      output = document.querySelector(defaults.tableElement);

    table.dealerHand = output.getElementsByClassName('dealer-hand')[0];
    table.dealerScoreBoard = output.getElementsByClassName('dealer-score')[0];
    table.playerHand = output.getElementsByClassName('player-hand')[0];
    table.playerScoreBoard = output.getElementsByClassName('player-score')[0];


    deck.build(defaults.deckCount);

    player.firstDraw();

  },

  addPlayerCard: function(card) {
    table.playerHand.appendChild(cardVisual(card));
  },

  addDealerCard: function(card) {
    table.dealerHand.appendChild(cardVisual(card));
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

table.newGame({
  tableElement : '#jr_cardTable',
  deckCount : 1
});




