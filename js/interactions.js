const $ = jQuery = require("jquery");
const t = require('./torrent-notifier.js');
const settings = require('./settings.js');
const uiComp = require('./components.js');
const toaster = require('./toaster.js');

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

// Show listing Edit and Delete button handler
$(document).on('click', '.infoButton', function() {
	let actionItem = $(this).parent().attr('data');
	if (this.matches('.delete')) {
		if(window.confirm(`Are you sure you want to remove ${actionItem} from your list of shows?`)) {
			t.removeShow(actionItem);
			$(this).parent().parent().fadeOut().remove();
		}
	}
	else if (this.matches('.edit')) {
		console.log('Edit ' + actionItem);
		// TODO Make an edit page
	}
	else {
		console.log('Toggle ' + actionItem);
		t.toggleActive(actionItem);
		let $element = $(this).parent().find('.activeButton').toggleClass('active');
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
	let newShow = {
		nameOfShow : $('input[name="show-name"]'),
		nextEpisode : $('input[name="next-episode"]'),
		airDay : $('input[name="air-day"]'),
		airTime : $('input[name="air-time"]'),
		timezone : $('input[name="show-time"]'),
		active : $('input[name="active"]:checked').attr('value')
	}
	t.addShow(newShow);
});

// Close toast notification
$(document).on('click', '.close', function() {
	toaster.hideToast();
});