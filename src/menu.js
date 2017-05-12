import { getFormData, CustomEl } from './utils';

/** Class Menu represents the pre-game options menu */
export default class Menu {
  /**
   * Sets up the user input to start the game
   * @param {oject}    table  - table element
   * @param {function} optsFn - game function to update the settings and start a new game
   */
  constructor(table, optsFn) {
    this.table = table;
    this.form = this.buildForm();
    this.optsFn = optsFn;
  }

  /**
   * Creates the user options input.
   */
  buildFrom() {
    const formObj = new CustomEl('form', { class: 'intro-form' });
    const form = formObj.el;

    const inputs = {
      decks: ['Deck Count', 'number', 6],
      player1: ['Player 1', 'text', 'Aaron'],
      player2: ['Player 2', 'text', 'Beth'],
      player3: ['Player 3', 'text', 'Chris'],
      player4: ['Player 4', 'text', 'Denise'],
      player5: ['Player 5', 'text', 'Ethan'],
      submit: ['New Game', 'submit', 'Go'],
    };

    Object.keys(inputs).forEach((input) => {
      const name = input;
      const placeholder = inputs[input][0];
      const type = inputs[input][1];
      const text = inputs[input][2];

      const labelObj = new CustomEl('label', {
        class: `form-label label-${name} label-${type}`,
        for: `input-${name}`,
        text: name,
      });

      const inputObj = new CustomEl('input', {
        class: `form-input input-${name} input-${type}`,
        name,
        type,
        placeholder,
        id: `input-${name}`,
        value: text || '',
        min: type === 'number' ? 1 : '',
      });

      let btnObj = null;

      if (type === 'text') {
        btnObj = new CustomEl('button', {
          class: 'clear-player',
          text: 'X',
        });

        btnObj.el.addEventListener('click', (e) => {
          e.preventDefault();
          e.target.nextElementSibling.value = '';
        });
      }

      [labelObj, inputObj, btnObj].forEach(newItem => form.appendChild(newItem.el));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      this.setupGame();
    });

    this.table.parentElement.insertBefore(form);

    return form;
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
    const inputs = getFormData(this.form).map(input => input.value);

    this.optsFn({
      deckCount: inputs.shift(),
      players: inputs.filter(value => value !== ''),
    });
  }
}
