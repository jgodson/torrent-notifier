const $ = jQuery = require('jquery');

module.exports.Searcher = function Searcher(options) {
	let searcherHTML = `<div class='searcher'>
		<div class='searcher-box'></div>
		</div>`;

	this.element = '';
	this.start_search = options.start_search || 3;
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
		$(this.element).on('keyup', () => {
			if (this.element.val().length >= this.start_search) {
				this.search_function(this.element.val());
			}
			else {
				$('.searcher-box').html('');
			}
		});

		$(this.element).on('focus', () => {
			this.element.keyup();
		});

		$(this.element).on('blur', () => {
			// Hide seacher box on loss of input focus if not hovering over it
			try {
				// Check to see if hovering over searcher box, if not hide it.
				if (!$('.searcher-box').filter(':hover')[0].className === 'searcher-box') $('.searcher-box').html('');
			}
			catch (e) {
				// Or if element doesn't have className property, still hide searcher box
				$('.searcher-box').html('')
			}
		});

		$(document).on('click', '.searcher-box p', this.result_onclick);
	}
	this.initialize = function initialize(element) {
		this.element = element;
		$(this.element.parent()).append(searcherHTML);
		if (this.scrollable) $('.searcher').css({'overflow-y' : 'auto'});
		this.start();
	}

	function appendResults(results) {
		$('.searcher-box').html('');
		results.forEach( (result) => {
			$('.searcher-box').append(`<p>${result}</p>`);
		});
	}

	function search_function(query) {
		let results = [];
		for (let i = 0; i < this.source.length; i++) {
			if (this.source[i].toLowerCase().includes(query.toLowerCase())) {
				results.push(this.source[i]);
			}
			if (results.length === this.max_results) {
				appendResults(results);
				return;
			}
		}
		appendResults(results);
	}

	function result_onclick(event) { 
		this.element.val(event.target.textContent);
		$('.searcher-box').html('');
	}
}
	