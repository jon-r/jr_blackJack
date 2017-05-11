import { newEl, getFormData } from './utils';

/** Class Menu represents the pre-game options menu */
export default class Menu {
  /**
   * Sets up the user input to start the game
   * @param {oject}    table  - table element
   * @param {function} optsFn - game function to update the settings and start a new game
   */
  constructor(table, optsFn) {
    this.build(table);
    this.optsFn = optsFn;
  }

  /**
   * Creates the user options input.
   * @param {object} table - table element
   */
  build(table) {
    const form = table.parentElement
     .insertBefore(newEl('form', [['class', 'intro-form']]), table);
    const rows = new Map([
      ['decks', ['Deck Count', 'number', 6]],
      ['p-1', ['Player 1', 'text', 'Aaron']],
      ['p-2', ['Player 2', 'text', 'Beth']],
      ['p-3', ['Player 3', 'text', 'Chris']],
      ['p-4', ['Player 4', 'text', 'Denise']],
      ['p-5', ['Player 5', 'text', 'Ethan']],
      ['submit', ['New Game', 'submit', 'Go']],
    ]);

    rows.forEach(([name, arr]) => {
      const newLabel = newEl('label', [
        ['class', `form-label label-${name} label-${arr[1]}`],
        ['for', `input-${name}`],
        ['text', arr[0]],
      ]);
      const newInput = newEl('input', [
        ['class', `form-input input-${name} input-${arr[1]}`],
        ['name', name],
        ['type', arr[1]],
        ['placeholder', arr[0]],
        ['id', `input-${name}`],
        ['value', arr[2] || ''],
        ['min', arr[1] === 'number' ? 1 : ''],
      ]);
      [newLabel, newInput].forEach(el => form.appendChild(el));
      if (arr[1] === 'text') {
        const btn = newEl('button', [
          ['class', 'clear-player'],
          ['text', 'X'],
        ]);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.target.nextElementSibling.value = '';
        });
        form.insertBefore(btn, newInput);
      }
    });

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
    const inputs = getFormData(this.form).map(input => input.value);

    this.optsFn({
      deckCount: inputs.shift(),
      players: inputs.filter(value => value !== ''),
    });
  }
}
