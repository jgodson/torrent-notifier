// Requires jquery to use
const $ = jQuery = require('jquery');
// Also requires accompaning stylesheet searcher.css (or custom styles)

module.exports.Searcher = function Searcher(options) {
  this.currentResult = 0; // for traversing through the dropdown lists.
  this.keyMap = { // Map functions to specific keys
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
  this.main_container = null; // Background container of view (used to hide search box on clicks)
  this.searcher = null; // The .searcher div that encloses the searcher_box
  this.searcher_box = null; // The .searcher-box div that encloses the p from results[]
  this.element = null; // The input element
  this.start_search = options.start_search || 1; // Characters typed before startig to call search_function
  this.max_results = options.max_results || 5; // Max number of results in searcher_box
  this.scrollable = options.scrollable || false; // If div is scrollable or not overflow hidden otherwise
  this.search_function = options.search_function || search_function; // Specific search function or default
  this.result_onclick =  // specify on click function or use default need typeof check to use .bind()
    typeof options.result_onclick === 'function' ? options.result_onclick.bind(this) : result_onclick.bind(this);
  this.source = options.source || []; // The souce array to search

  this.stop = function() { // Remove all event listeners
    $(this.element).off();
    $(this.searcher).off();
    $(this.searcher_box).off();
    $(this.main_container).off();
  }

  this.start = function() { // Add event listeners
    $(this.element).on('keyup', (e) => {
      // 38 - UP , 40 - DOWN , 13 - ENTER, 27 - ESC, 9 - TAB
      if (e.keyCode === 40 || e.keyCode === 9) {
         // set what number the highlighed p will be, then focus
        this.currentResult = 0;
        $(this.searcher_box.find('p')[0]).focus();
        return;
      }
      else if (e.keyCode === 38) {
        // set what number the highlighed p will be, then focus
        this.currentResult = this.searcher_box.find('p').length - 1; 
        $(this.searcher_box.find('p:last')[0]).focus();
        return;
      }
      // Check to see if start length is reached and call search_function if so
      if (this.element.val().length >= this.start_search) {
        this.search_function(this.element.val());
      }
      else { // hide search results if we don't have enough characters yet
        this.searcher_box.html('');
      }
    });

    // Disable tab key (tab normally works on keydown)
    this.element.on('keydown', (e) => {
      if (e.keyCode === 9) {
        e.preventDefault();
      }
    });

    // Disable tab key (tab normally works on keydown)
    this.searcher_box.on('keydown', 'p', (e) => {
      if (e.keyCode === 9) {
        e.preventDefault();
      }
    });

    // Bring up the search menu when focused (in case there has been text entered already)
    $(this.element).on('focus', () => {
      this.element.keyup(); // undefined keystroke
    });

    // Apply the value of the clicked result to the input
    this.searcher_box.on('click', 'p', this.result_onclick);

    // Prevent scrolling of div with arrow keys (since they move between options)
    this.searcher.on('keydown', (e) => {
      e.preventDefault();
    });

    // Call functions based on key presses
    this.searcher_box.on('keyup', 'p', (e) => {
      // Check if key pressed is in keyCode function map and call it if it is
      if(typeof this.keyMap[e.keyCode] === 'function') {
        this.keyMap[e.keyCode].call();
      }
      else {
        if (e.keyCode === 9) { // Check tab key here and call UP function if found
          this.keyMap[40].call();
        }
        else { // if letter key or other key, return focus to input
          this.element.focus();
        }
      }
    });

    // Watch for element losing focus so we can hide the results list
    this.main_container.on('click', () => {
      // If not hovering over any divs or the input element, hide search results
      if (this.element.filter(':hover').length === 0) {
        this.searcher_box.html('');
      };
    });
  }

  // Appened the divs to the element and start the event listeners
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

  // Append results from search_function to the searcher-box div
  this.append_results = function append_results(results) {
      this.searcher_box.html('');
      results.forEach( (result) => {
        // Tab index to allow focus
        this.searcher_box.append(`<p tabindex="1">${result}</p>`);
      });
  }

  // The default search function to use
  function search_function(query) {
    let results = [];
    for (let i = 0; i < this.source.length; i++) {
      if (this.source[i].toLowerCase().includes(query.toLowerCase())) {
        results.push(this.source[i]);
      }
      // If max_results is reached, append now and stop loop
      if (results.length === this.max_results) {
        this.append_results(results)
        return;
      }
    }
    // If max_results never reached, append after loop finishes
    this.append_results(results);
  }

  // The default on click function to use for clicking on search result
  function result_onclick(event) { 
    this.element.val(event.target.textContent);
    this.searcher_box.html('');
  }
}
  