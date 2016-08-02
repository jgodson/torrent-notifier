'use strict';

const $ = jQuery = require("jquery");
const t = require('./torrent-notifier.js');
const settings = require('./settings.js');
const uiComp = require('./components.js');
const toaster = require('./toaster.js');
const utils = require('./utils.js');
const scheduler = require('./scheduler.js');
const Searcher = require('./searcher.js').Searcher;
const moment = require('moment-timezone');

const VALID_TIMEZONES = moment.tz.names(); // Get array of valid timezones from moment-timezone
const VALID_DAYS = "Monday Tuesday Wednesday Thursday Friday Saturday Sunday"; // String of days

// Set up our fancy search boxes (searcher.js)
let timezoneSearcher = new Searcher({ // This one is for the timezone field
  source : VALID_TIMEZONES,
  max_results : 15,
  scrollable : true
});

let daySearcher = new Searcher({ // This one is for the air days field
  source : VALID_DAYS.split(' '), // Split the string into an array
  max_results : 7
});

let currentImageURL = null; // For tempory saving after getting image from tvmaze api
const $backdrop = $('#backdrop'); // Use this frequently, so a constant makes sense

/*  
  Set up starting and stoping of searchers (to start/disable event listeners)
  and to add them to the UI when needed.
  Need these after backdrop variable as it is used when initializing Searchers
*/
const stopSearchers = function () {
  timezoneSearcher.stop();
  daySearcher.stop();
}
const initSearchers = function () {
  timezoneSearcher.initialize($('input[name="timezone"]'), $backdrop);
  daySearcher.initialize($('input[name="air-day"]'), $backdrop);
}

// ---- Animations ----
// Status dropdown animation
$('#connection-info').hover( function() {
  $('#connection').slideToggle();
});

// ---- Event Listeners ----
// Calendar day click displays time show is on
$(document).on('click', '.day', function() {
  $(this).find('.showOnDay').toggleClass('open');
  let nextElement = $(this).find('.showTimeOnDay');
  if (nextElement.css('display') === 'none') {
    nextElement.css('display', 'block');
  }
  else {
    nextElement.css('display', 'none');
  }
});

// Download button starts manual search for show
$(document).on('click', '.downloadButton', function() {
  let actionItem = $(this).parent().attr('data');
  if(window.confirm(`Check for new episodes of ${actionItem} now?`)) {
    t.emitMessage(`Manual check for ${actionItem} started!`);
    t.checkForNewEpisode(actionItem, 'manual', function(results) {
      if (results.length > 0) {
        toaster.showToast(`Manual check for ${actionItem} received results!`);
      }
      else {
        toaster.showToast(`Manual check for ${actionItem} had no results.`);
      }
    });
  }
});

// Hide the currently shown toast
$(document).on('click', '.close', function() {
  toaster.hideToast();
});

// Show listing Edit and Delete button handler
$(document).on('click', '.infoButton', function() {
  let actionItem = $(this).parent().attr('data');
  if (this.matches('.delete')) {
    // Confirm delete and then remove from Show List, scheduler and UI
    if(window.confirm(`Are you sure you want to remove ${actionItem} from your list of shows?`)) {
      scheduler.cancelShow(actionItem);
      t.removeShow(actionItem);
      $(this).parent().parent().fadeOut().remove();
    }
  }
  else if (this.matches('.edit')) {
    // Build edit dialog
    $backdrop.fadeIn();
    $('#changeContainer').html(uiComp.buildDialog(actionItem));
    initSearchers();
  }
  else {
    // Make active in Show List and add/remove scheduler jobs
    if(t.toggleActive(actionItem)) {
      scheduler.scheduleShow(actionItem);
    }
    else {
      scheduler.cancelShow(actionItem);
    }
    $(this).parent().find('.activeButton').toggleClass('active');
  }
});

// Add show button click displays new show dialog
$(document).on('click', '#addShowButton', function() {
  $backdrop.fadeIn();
  $('#changeContainer').html(uiComp.buildDialog());
  initSearchers();
});

// Checkbox input toggles clicked setting in file
$(document).on('click', '.setting input[type="checkbox"]', function() {
  settings.toggleSetting($(this).attr('data-setting'));
});

// Cancel edit/new show dialog
$(document).on('click', '.close-dialog', function() {
  $backdrop.fadeOut();
  stopSearchers();
  currentImageURL = null; // reset image url on dialog close
});

// Save edits/new show
$(document).on('click', '#save-btn', function () {
  const $error = $('#dialog-errors');  // Set error div as jQuery object

  $error.removeAttr('style'); // Reset error div styles

  // Get values and make show object
  let dayArray = $('input[name="air-day"]').val().toLowerCase().replace(/ /g, '').split(',');
  let newShow = {
    nameOfShow : $('input[name="show-name"]').val().trim(),
    nextEpisode : $('input[name="next-episode"]').val().toUpperCase().trim() || 'S01E01',
    airDay : dayArray,
    airTime : $('input[name="air-time"]').val(),
    timezone : $('input[name="timezone"]').val().trim() || 'America/New_York',
    active : $('input[name="active"]:checked').val() == true ? true : false // Ensure Boolean value
  }

  // New/Edit show validation
  if (newShow.nameOfShow.trim().length < 4) {
    $error.css('visibility', 'visible');
    $error.text('Show Name is invalid');
    $error.css('animation', 'scaleIn 600ms');
    return;
  }
  if (newShow.nextEpisode.search(/^S\d{2}E\d{2}$/) === -1) {
    $error.css('visibility', 'visible');
    $error.text('Next Episode format is incorrect');
    $error.css('animation', 'scaleIn 600ms');
    return;
  }
  let error = null; // look for problen with airDay
  newShow.airDay.forEach( function(day) {
    if (!VALID_DAYS.toLowerCase().split(' ').includes(day)) {
      $error.css('visibility', 'visible');
      $error.text(`Air Day is not valid`);
      $error.css('animation', 'scaleIn 600ms');
      error = true;
      return;
    }
  });
  if (error) return; // stop execution if there was an error
  if (!VALID_TIMEZONES.includes(newShow.timezone)) {
    $error.css('visibility', 'visible');
    $error.text('Timezone is not valid');
    $error.css('animation', 'scaleIn 600ms');
    return;
  }

  // Change first letter of each day to a capital
  for (let i = 0 ; i < newShow.airDay.length ; i++) {
    newShow.airDay[i] = newShow.airDay[i].substring(0, 1).toUpperCase() + newShow.airDay[i].substring(1);
  }

  // Add the show to all the things (or save the edits)
  if(!t.getShow(newShow.nameOfShow)) {
    t.addShow(newShow);
    scheduler.scheduleShow(newShow.nameOfShow);
    toaster.showToast(`${newShow.nameOfShow} successfully added to list!`);
    // Check if there was an image URL saved
    if (currentImageURL) {
      utils.getImage(newShow.nameOfShow, currentImageURL, function() {
        uiComp.buildShow(newShow.nameOfShow, newShow, function (newShowHTML) {
          // Check to see if the 'no shows' paragraph is present.
          if ($('#show-list').find('p').length > 0) {
            $('#show-list').html(''); // Clear hmtl if it is so we don't display it any more
          }
          $('#show-list').append(newShowHTML);
          $backdrop.fadeOut();
        });
      });
    }
    else {
      uiComp.buildShow(newShow.nameOfShow, newShow, function (newShowHTML) {
        $('#show-list').append(newShowHTML);
        $backdrop.fadeOut();
      });
    }
  }
  else {
    t.emitMessage(`Edit of ${newShow.nameOfShow} was successful`);
    // Remove and reschedule in case of change in air time/day or timezone
    scheduler.cancelShow(newShow.nameOfShow);
    // Change the active toggle star if active status changed
    if (newShow.active !== t.isActive(newShow.nameOfShow)) { 
      $(`div[data="${newShow.nameOfShow}"]`).find('.activeButton').toggleClass('active');
    }
    t.addShow(newShow);
    scheduler.scheduleShow(newShow.nameOfShow);
    toaster.showToast(`Changed saved!`);
    $backdrop.fadeOut();
  }
});

// Get other info automatically after show name entered (if the setting is on)
$(document).on('blur', 'input[name="show-name"]', function () {
  if(settings.getSetting('Auto Show Search') && $('input[name="show-name"]').val().trim().length >= 4) {
    $('#request-status').fadeIn();
    utils.getInfo($('input[name="show-name"]').val().trim(), function(err, showData) {
      if (!err) {
        $('#request-status').fadeOut();
        $('input[name="show-name"]').val(showData.nameOfShow),
        $('input[name="air-day"]').val(showData.airDay);
        $('input[name="air-time"]').val(showData.airTime);
        $('input[name="timezone"]').val(showData.timezone);
        currentImageURL = showData.image;
      }
      else {
        $('#request-status').fadeOut();
        currentImageURL = null; // Reset image url if there were no results
      }
    });
  }
});