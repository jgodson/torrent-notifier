const $ = jQuery = require("jquery");
const t = require('./torrent-notifier.js');
const settings = require('./settings.js');
const uiComp = require('./components.js');
const toaster = require('./toaster.js');
const utils = require('./utils.js');
const scheduler = require('./scheduler.js');
const moment = require('moment-timezone');

const VALID_TIMEZONES = moment.tz.names();
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

let currentImageURL = null; // For tempory saving after getting image from tvmaze api
const $backdrop = $('#backdrop');

// ---- Animations ----
// Status dropdown animation
$('#connection-info').hover( function() {
	$('#connection').slideToggle();
});

// Show Listing Fade Animations
$(document).on('mouseenter', '.showListing', function() {
	$(this).find('.info').fadeIn();
});

$(document).on('mouseleave', '.showListing', function() {
	$(this).find('.info').fadeOut();
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

$(document).on('click', '.downloadButton', function() {
	let actionItem = $(this).parent().attr('data');
	if(window.confirm(`Check for new episodes of ${actionItem} now?`)) {
		t.emitMessage(`Manual check for ${actionItem} started!`);
		t.checkForNewEpisode(actionItem, 'manual', function(newEpisodeFound) {
			if (newEpisodeFound) {
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
			t.removeShow(actionItem);
			scheduler.cancelShow(actionItem);
			$(this).parent().parent().fadeOut().remove();
		}
	}
	else if (this.matches('.edit')) {
		// Build edit dialog
		$backdrop.fadeIn();
		$('#changeContainer').html(uiComp.buildDialog(actionItem));
	}
	else {
		// Make active in Show List and add to scheduler jobs
		t.toggleActive(actionItem);
		scheduler.scheduleShow(actionItem);
		$(this).parent().find('.activeButton').toggleClass('active');
	}
});

// Add show button click displays new show dialog
$(document).on('click', '#addShowButton', function() {
	$backdrop.fadeIn();
	$('#changeContainer').html(uiComp.buildDialog());
});

// Checkbox input changes clicked setting in file
$(document).on('click', '.setting input[type="checkbox"]', function() {
	settings.toggleSetting($(this).attr('data-setting'));
});

// Cancel edit/new show dialog
$(document).on('click', '.close-dialog', function() {
	$backdrop.fadeOut();
});

// Save edits/new show
$(document).on('click', '#save-btn', function () {
	const $error = $('#dialog-errors');  // Set error div as jQuery object

	$error.removeAttr('style'); // Reset error div styles

	// Get values and make show object
	let dayArray = $('input[name="air-day"]').val().toLowerCase().replace(/ /g, '').split(',');
	let newShow = {
		nameOfShow : $('input[name="show-name"]').val().trim(),
		nextEpisode : $('input[name="next-episode"]').val().trim() || 'S01E01',
		airDay : dayArray,
		airTime : $('input[name="air-time"]').val(),
		timezone : $('input[name="timezone"]').val().trim() || 'America/New_York',
		active : $('input[name="active"]:checked').val() == true ? true : false
	}
	// Validation
	if (newShow.nameOfShow.trim().length < 4) {
		$error.css('visibility', 'visible');
		$error.text('Show name is invalid');
		$error.css('animation', 'scaleIn 600ms');
		return;
	}
	if (newShow.nextEpisode.search(/^S\d{2}E\d{2}$/) === -1) {
		$error.css('visibility', 'visible');
		$error.text('Next Episode format incorrect');
		$error.css('animation', 'scaleIn 600ms');
		return;
	}
	newShow.airDay.forEach( function(day) {
		if (!VALID_DAYS.includes(day)) {
			$error.css('visibility', 'visible');
			$error.text(`${day} is not valid`);
			$error.css('animation', 'scaleIn 600ms');
			return;
		}
	});
	console.log(VALID_TIMEZONES.includes(newShow.timezone));
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
		toaster.showToast(`${newShow.nameOfShow} successfully added to list!`);
		if (currentImageURL) {
			utils.getImage(newShow.nameOfShow, currentImageURL, function() {
				uiComp.buildShow(newShow.nameOfShow, newShow, function (newShowHTML) {
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
		t.addShow(newShow);
		toaster.showToast(`Changed saved!`);
		$backdrop.fadeOut();
	}
});

// Show list of timezones while typing


// Get other info automatically after show name entered
$(document).on('blur', 'input[name="show-name"]', function () {
	if(settings.getSetting('Auto Show Search')) {
		$('#request-status').fadeIn();
		utils.getInfo($('input[name="show-name"]').val(), function(err, showData) {
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
			}
		});
	}
});