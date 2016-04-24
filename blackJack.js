"use strict";

var output = document.getElementById('js_output');

var suits = ['diamonds', 'hearts', 'spades', 'clubs'],
  faces = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'],
  faceSm = {0 : 'A', 10 : 'J', 11 : 'Q', 12 : 'K'};

var cards = {
  count: 0,
  deck: [],


  build: function (deckCount) {
    //decks
    for (var i = 0; i < deckCount; i++) {
      //suits
      for (var j = 0; j < 4; j++) {
        //cards
        for (var k = 0; k < 13; k++) {
          cards.deck.push([k, j]);
        }
      }
    }
    cards.count = cards.deck.length;
  },

  shuffle: function() {
    //https://www.kirupa.com/html5/shuffling_array_js.htm
    for (var i = cards.count-1; i >=0; i--) {

        var randomIndex = Math.floor(Math.random()*(i+1)),
          itemAtIndex = cards.deck[randomIndex];

        cards.deck[randomIndex] = cards.deck[i];
        cards.deck[i] = itemAtIndex;
    }
  },

  draw: function(num) {
    return cards.deck.splice(0,num);
  },

  prettyStr: function(cardArr) {
    output = faces[cardArr[0]] + ' of ' + suits[cardArr[1]];
    return output;
  },

  prettyEl: function(cardArr) {
    var card = document.createElement('div'),
      cardVal = document.createElement('span'),
      cardDes = document.createElement('div');

    card.className = 'card ' + suits[cardArr[1]];
    cardVal.innerHTML = faceSm[cardArr[0]] || cardArr[0] + 1;
    //cardDes.src += 'card-' + faces[cardArr[0]] + '.svg'

    card.appendChild(cardVal);
    card.appendChild(cardDes);

    return card;
  },

  show: function (input) {
    var count = input.length;
    var out = "<h1>Deck: </h1>"
    for (var i = 0; i < count; i++) {
      out += cards.prettyStr(input[i]) + '<br />';
      document.getElementById('js_cardTable').appendChild(cards.prettyEl(input[i]));
    }
    return out;
  }
}

cards.build(1);
cards.shuffle();
output.innerHTML = cards.show(cards.draw(5));
