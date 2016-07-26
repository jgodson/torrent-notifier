const $ = jQuery = require('jquery');

module.exports.Searcher = function Searcher(options) {
  this.currentResult = -1; // for traversing through the dropdown lists.
  this.keyMap = {
    40 : () => {
      // Down Key Press
      console.log(`${this.currentResult + 1}/${this.searcher_box.find('p').length}`);
      if (this.searcher_box.find('p').length > 0) {
        this.searcher_box.find('p')[this.currentResult < 0 ? 0 : this.currentResult].classList.remove('hovered');
        if (this.searcher_box.find('p').length - 1 > this.currentResult) {
          this.currentResult++;
          //console.log(this.searcher_box.scrollTop());
        }
        else {
          this.currentResult = 0;
          console.log(this.searcher_box.scrollTop());
        }
        this.searcher_box.find('p')[this.currentResult].classList.add('hovered');
      }
    },
    38 : () => {
      // Up Key Press
      console.log(`${this.currentResult - 1}/${this.searcher_box.find('p').length}`);
      if (this.searcher_box.find('p').length > 0) {
        this.searcher_box.find('p')[this.currentResult > 1 ? 0 : this.currentResult].classList.remove('hovered');
        if (this.currentResult > 1) {
          this.currentResult--;
        }
        else {
          this.currentResult = this.searcher_box.find('p').length;
        }
        this.searcher_box.find('p')[this.currentResult].classList.add('hovered');
      }
    },
    13 : () => {
      // Enter Key Press
      this.element.val($(this.searcher_box).find('p')[this.currentResult].innerText);
    }
  }
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
    $(this.element).off();
  }
  this.start = function() {
    $(this.element).on('keyup', (e) => {
      // 38 - UP , 40 - DOWN , 13 - ENTER
      if(typeof this.keyMap[e.keyCode] === 'function') {
        this.keyMap[e.keyCode].call();
        return;
      }
      if (this.element.val().length >= this.start_search) {
        this.currentResult = -1; // reset current result if they are typing
        this.search_function(this.element.val());
      }
      else {
        this.searcher_box.html('');
      }
    });

    // Bring up the search menu when focused (in case there has been text entered already)
    $(this.element).on('focus', () => {
      this.element.keyup();
    });

    // On loss of focus, clear the search box (except if they are hovering over the search box)
    $(this.element).on('blur', () => {
      try {
        // Check to see if hovering over searcher box, if not hide it.
        this.currentResult = -1; // reset current result for the dropdown
        if (!this.searcher_box.filter(':hover')[0].className === 'searcher-box') this.searcher_box.html('');
      }
      catch (e) {
        // If it throws an error because it doesn't have className then it's not the search box
        this.searcher_box.html('');
      }
    });

    // Apply the value of the clicked result to the input
    this.searcher_box.on('click', 'p', this.result_onclick);
  }
  this.initialize = function initialize(element) {
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
      this.searcher_box.append(`<p>${result}</p>`);
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
  