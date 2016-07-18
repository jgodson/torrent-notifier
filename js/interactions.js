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
		// TODO Make an edit page
	}
	else {
		t.toggleActive(actionItem);
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
	let newShow = {
		nameOfShow : $('input[name="show-name"]').val(),
		nextEpisode : $('input[name="next-episode"]').val(),
		airDay : $('input[name="air-day"]').val(),
		airTime : $('input[name="air-time"]').val(),
		timezone : $('input[name="timezone"]').val(),
		active : $('input[name="active"]:checked').val()
	}
	t.addShow(newShow);
});

// Close toast notification
$(document).on('click', '.close', function() {
	toaster.hideToast();
});

// Get other info automatically after show name entered
$(document).on('blur', 'input[name="show-name"]', function () {
	if(settings.getSetting('Auto Show Search')) {
		$('#request-status').fadeIn();
		utils.getInfo($('input[name="show-name"]').val(), function(showData) {
			$('#request-status').fadeOut();
			$('input[name="airDay"]').val(showData.airDay);
			$('input[name="air-time"]').val(showData.airTime);
			$('input[name="timezone"]').val(showData.timezone);
		});
	}
});