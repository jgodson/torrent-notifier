const $ = jQuery = require('jquery');

module.exports.Searcher = function Searcher(options) {
  this.currentResult = 0; // for traversing through the dropdown lists.
  this.keyMap = {
    40 : () => {
      // Down Key Press
        if (this.searcher_box.find('p').length - 1 > this.currentResult) {
          this.currentResult++;
          //console.log(`${this.currentResult}/${this.searcher_box.find('p').length}`);
        }
        else {
          this.currentResult = 0;
          //console.log(this.currentResult);
        }
        $(this.searcher_box.find('p')[this.currentResult]).focus();
    },
    38 : () => {
      // Up Key Press
        if (this.currentResult > 0) {
          this.currentResult--;
          //console.log(`${this.currentResult}/${this.searcher_box.find('p').length}`);
        }
        else {
          // Subtract 1 for 0 index -> length not 0 index
          this.currentResult = this.searcher_box.find('p').length - 1;
          //console.log(this.currentResult);
        }
        $(this.searcher_box.find('p')[this.currentResult]).focus();
    },
    27 : () => {
      // Esc key press
      this.searcher_box.html('');
    },
    13 : () => {
      // Enter Key Press
      this.element.val($(this.searcher_box).find('p')[this.currentResult].innerText);
      this.searcher_box.html('');
    }
  }
  this.main_container = null;
  this.searcher = null;
  this.searcher_box = null;
  this.element = null;
  this.start_search = options.start_search || 1;
  this.max_results = options.max_results || 5;
  this.scrollable = options.scrollable || false;
  this.search_function = options.search_function || search_function;
  this.result_onclick = 
    typeof options.result_onclick === 'function' ? options.result_onclick.bind(this) : result_onclick.bind(this);
  this.source = options.source || [];
  this.stop = function() {
    // Remove all event listeners
    $(this.element).off();
    $(this.searcher).off();
    $(this.searcher_box).off();
    $(this.main_container).off();
  }
  this.start = function() {
    // Add event listeners
    $(this.element).on('keyup', (e) => {
      // 38 - UP , 40 - DOWN , 13 - ENTER, 27 - ESC, 9 - TAB
      if (e.keyCode === 40 || e.keyCode === 9) {
         // set what number the highlighed p will be then focus
        this.currentResult = 0;
        $(this.searcher_box.find('p')[0]).focus();
        return;
      }
      else if (e.keyCode === 38) {
        // set what number the highlighed p will be then focus
        this.currentResult = this.searcher_box.find('p').length - 1; 
        $(this.searcher_box.find('p:last')[0]).focus();
        return;
      }
      if (this.element.val().length >= this.start_search) {
        this.search_function(this.element.val());
      }
      else {
        // hide search results if we don't have enough characters yet
        this.searcher_box.html('');
      }
    });

    // Listen for tab key (tab normally works on keydown)
    this.element.on('keydown', (e) => {
      if (e.keyCode === 9) {
        e.preventDefault();
      }
    });

    // Listen for tab key (tab normally works on keydown)
    this.searcher_box.on('keydown', 'p', (e) => {
      if (e.keyCode === 9) {
        e.preventDefault();
      }
    });

    // Bring up the search menu when focused (in case there has been text entered already)
    $(this.element).on('focus', () => {
      this.element.keyup();
    });

    // Apply the value of the clicked result to the input
    this.searcher_box.on('click', 'p', this.result_onclick);

    // Prevent scrolling of div with arrow keys (since they move between options)
    this.searcher.on('keydown', (e) => {
      e.preventDefault();
    });

    // Call functions based on key presses
    this.searcher_box.on('keyup', 'p', (e) => {
      if(typeof this.keyMap[e.keyCode] === 'function') {
        this.keyMap[e.keyCode].call();
      }
      else {
        if (e.keyCode === 9) {
          this.keyMap[40].call();
        }
        else {
          this.element.focus();
        }
      }
    });

    // Watch for element losing focus so we can hide the results list
    this.main_container.on('click', () => {
      if (this.element.filter(':hover').length === 0) {
        this.searcher_box.html('');
      };
    });
  }

  this.initialize = function initialize(element, main_container) {
    this.main_container = main_container;
    this.element = element;
    let searcherHTML = `<div class='searcher ${`searcher-${element.attr('name')}`}'>
      <div class='searcher-box'></div>
      </div>`;
    this.element.parent().append(searcherHTML);
    this.searcher = $(`.searcher-${element.attr('name')}`);
    this.searcher_box = $(this.searcher).find('.searcher-box');
    if (this.scrollable) this.searcher.css({'overflow-y' : 'auto'});
    this.start();
  }

  this.append_results = function append_results(results) {
      this.searcher_box.html('');
      results.forEach( (result) => {
        this.searcher_box.append(`<p tabindex="1">${result}</p>`);
      });
  }

  function search_function(query) {
    let results = [];
    for (let i = 0; i < this.source.length; i++) {
      if (this.source[i].toLowerCase().includes(query.toLowerCase())) {
        results.push(this.source[i]);
      }
      if (results.length === this.max_results) {
        this.append_results(results)
        return;
      }
    }
    this.append_results(results);
  }

  function result_onclick(event) { 
    this.element.val(event.target.textContent);
    this.searcher_box.html('');
  }
}
  