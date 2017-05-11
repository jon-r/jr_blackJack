 /* - misc functions ---------------------------------------------------- */


  // nodelist to array
  export function nodesArray(nodelist) {
    //to make sure the list isnt empty;
    if (!nodelist) return null;

    return Array.prototype.slice.call(nodelist);
  }

  /**
   * parses a webform and returns entries as an array
   * @param {object} form - the formitself
   * returns {array} key/value pairs
   */
  export function getFormData(form) {
    let formInputs = form.getElementsByTagName('input');

    return nodesArray(formInputs)
      .filter(input => input.name != 'submit')
      .map(input => ({name: input.name, value: input.value}));
  }

  /**
   * adds a natural variance to the dealt hands
   * @param {number} scale - The scale of the jiggling
   * @returns {string} the transform property value;
   */
  export function transformJiggle(scale) {
    let nudgeX,
      nudgeY,
      rotate;

    [nudgeX,nudgeY,rotate] = [0,0,0].map(() => (Math.random() - 0.5) * scale);

    return `translate(${nudgeX}px,${nudgeY}px) rotate(${rotate}deg)`;
  }

  /**
   * creates a new element object
   * @param   {string} el    - element type
   * @param   {Array}  attrs - element attributes
   * @returns {object} new element in the DOM
   */
  export function newEl(el,attrs) {
    let element = doc.createElement(el);

    return setAttributes(element,attrs);
  }

  /**
   * sets attributes of an object
   * http://stackoverflow.com/a/12274886
   * @param   {object} el    - element node
   * @param   {Array}  attrs - element attributes
   * @returns {object} updates element
   */
  export function setAttributes(el,attrs) {
    let attrMap = new Map(attrs);

    for (let [attr,val] of attrMap) {
      if ((attr === 'styles' || attr === 'style') && typeof val === 'object') {
        for (let prop in val) {
          el.style[prop] = val[prop];
        }
      } else if (attr === 'text') {
        el.textContent = val;
      } else {
        el.setAttribute(attr, val);
      }
    }

    return el;
  }

  /**
   * chains functions to run in sequence, with preset delay
   * http://stackoverflow.com/a/6921279
   * @param   {function} fn - function to run
   * @param   {time}     t - delay in ms before performing function
   * @returns {*}         self
   */
  export function delay(fn, t) {
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
