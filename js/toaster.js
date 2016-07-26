'use strict';

const $ = jQuery = require('jquery');
const $toaster = $('#toaster');
let timer;
let shown = false;
let backlog = [];

function showToast(message) {
  if (shown) {
    backlog.push(message);
  }
  else{
    $toaster.find('#toaster-content div span').text(message);
    $toaster.addClass('shown');
    timer = setTimeout( () => {
      hideToast();
    }, 10000);
    shown = true;
  }
}
module.exports.showToast = showToast;

function hideToast() {
  clearTimeout(timer);
  shown = false;
  $toaster.removeClass('shown');
  if (backlog.length > 0) {
    // Wait for hide animation to finish
    setTimeout( () => {
      showToast(backlog.shift());
    }, 400);
  }
}
module.exports.hideToast = hideToast;