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
  cards: [],
  bet: 0
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

    table.hitPlayer();
  },

  hitDealer: function() {
    var card = deck.draw(1)[0];
    //card = cardVisual(cards[0]);
    dealer.cards.push(card);
    dealer.score += cardValue(card);
    //dealer.cards.appendChild(card);
    table.dealerHand.appendChild(cardVisual(card))
    table.updateDealer();
  },

  hitPlayer: function() {
    var card = deck.draw(1)[0];

    player.cards.push(card);
    player.score += cardValue(card);
    table.playerHand.appendChild(cardVisual(card));

    console.log(card);

    if (player.cards.length < 3 && card[0] == 0) {
      table.playerScoreBoard.textContent = 'Soft ' + player.score;
    } else {
      table.playerScoreBoard.textContent = player.score;
    }
  },


  updateDealer: function() {
    table.dealerScoreBoard.textContent = dealer.score;
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




