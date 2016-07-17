'use strict';

const $ = jQuery = require('jquery');
const $toaster = $('#toaster');
let timer;
let shown = false;

module.exports.showToast = function showToast(message) {
	if (shown) {
		hideToast();
		setTimeout( () => showToast(message), 400);
	}
	else{
		$toaster.find('#toaster-content div span').text(message);
		$toaster.addClass('shown');
		timer = setTimeout( () => hideToast(), 10000);
		shown = true;
	}
}

function hideToast() {
	clearTimeout(timer);
	shown = false;
	$toaster.removeClass('shown');
}
module.exports.hideToast = hideToast;