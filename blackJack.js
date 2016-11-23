window.addEventListener("ready", (function (doc) {
  "use strict";

  /* - gameplay functions ------------------------------------------------- */



  /* - score functions ---------------------------------------------------- */




  /* - deck object -------------------------------------------------------- */
  class deck {
    constructor(decksCount) {
      this.cards = [];

      //decks
      for (i = 0; i < decksCount; i++) {
        //suits
        for (j = 0; j < 4; j++) {
          //values
          for (k = 1; k < 14; k++) {
            deck.cards.push([k,j])
          }
        }
      }

      this.count =

    }
  }



  /* - game object -------------------------------------------------------- */



  /* - player object ------------------------------------------------------ */
  class player {
    constructor(id,name) {

    }
  }

  /* - ui object ---------------------------------------------------------- */



}(document)));
