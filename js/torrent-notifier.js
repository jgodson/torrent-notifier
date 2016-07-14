'use strict'

const fs = require('fs');
const request = require('request');
const EventEmitter = require('events');
const notifier = require('node-notifier');
const $ = jQuery = require("jquery");

// Create a new EventEmitter
const torrentAlerter = new EventEmitter();

// Specify File Name
const FILENAME = 'showList-test.json';

// Map JS days 0-6 to String versions
const dayMap = {
	1 : 'Monday',
	2 : 'Tuesday',
	3 : 'Wednesday',
	4 : 'Thursday',
	5 : 'Friday',
	6 : 'Saturday',
	0 : 'Sunday'
};

// Terminal Notifier examples are: TODO: Remove when appropriate

// TerminalNotifier.notify('Hello World')
// TerminalNotifier.notify('Hello World', :title => 'Ruby')
// TerminalNotifier.notify('Hello World', :group => Process.pid)
// TerminalNotifier.notify('Hello World', :activate => 'com.apple.Safari')
// TerminalNotifier.notify('Hello World', :open => 'http://twitter.com/alloy')
// TerminalNotifier.notify('Hello World', :execute => 'say "OMG"')
// TerminalNotifier.notify('Hello World', :sender => 'com.apple.Safari')
// TerminalNotifier.notify('Hello World', :sound => 'default')

// Variable to store list of shows user is interested in
let showList; // undefined until loadShowList is called

// Module exports object
var exports = {};

// ---- Event Listeners ----
// Triggered when request has new results from API
torrentAlerter.on('newData', function(data, currentShow) {
	(function(data) {
		// Loop through the results for this show
		for(let i = 20; i > 0; i--) {
			// Check to see if the new episode is in the title of this result
			if (data[i].title.indexOf(showList[currentShow].nextEpisode) !== -1) {
				torrentAlerter.emit('message', `New Episode of ${currentShow} found!`);
				data[i].showName = currentShow;

				// Triger the desktop notification
				newEpisodeAlert(data[i]);

				// Update nextEpisode to what should be the next episode
				showList[currentShow].nextEpisode = incrementEpisode(showList[currentShow].nextEpisode);
			}
			// When finished loop, decrement totalShows so we know when everything is finished
			if (i === 1) {
				totalShows--;
				// Check to see if we are finished now
				if (totalShows === 0) {
					// Save changes to disk when finished everything
					saveFile();
				}
			}
		}
	})(data);
});

// Triggered to log given message to GUI console
torrentAlerter.on('message', function(message) {
	$('#console').append(`<p>${new Date().toString()} - ${message}</p>`);
});

// Check API for given show name
function checkForNewEpisode(show) {
	// Make request to torrent API
	request(`https://torrentproject.se/?s=${encodeURIComponent(show)}&out=json&orderby=latest`, function(err, result) {
		// If error log to UI console that request was not successful
		if (err) {
			emitMessage(`Request to API for ${show} was unsuccessful.`);
		}
		// Trigger event to deal with data from API call if request was OK
		if (result.statusCode === 200) {
			torrentAlerter.emit('newData', JSON.parse(result.body), show);
		}
		else {
			emitMessage(`No new episode of ${show} was found`);
		}
	});
}
exports.checkForNewEpisode = checkForNewEpisode;

// Show notification center notification
function newEpisodeAlert(torrentInfo) {
	notifier.notify({
		'title': `New Episode of ${torrentInfo.showName} available!`,
		'sound': true,
		'message': 'Click to download top result',
		'open': `magnet:?xt=urn:btih:${torrentInfo.torrent_hash}`
	});
}

// Increments episode by one. Given in format: S##E##
function incrementEpisode(lastEpisode) {
	let last = lastEpisode.split('E');
	let nextEpisode = parseInt(last[1], 10) + 1;
	if (nextEpisode < 10) { nextEpisode = `0${nextEpisode}`; } // Append a 0 if it's less than 10
	return `${last[0]}E${nextEpisode}`;
}

// Function to allow other modules to emit a message to the GUI console
function emitMessage(message) {
	torrentAlerter.emit('message', message);
}
exports.emitMessage = emitMessage;

// Function to save changes to show list file
function saveFile() {
	try {
		fs.writeFileSync(`data/${FILENAME}`, JSON.stringify(showList));
		emitMessage('File saved successfully!');
	}
	catch (e) {
		emitMessage('Error saving file');
	}
}
exports.saveFile = saveFile;

// Return entire show list
function getShowList() {
	return showList;
}
exports.getShowList = getShowList;

// Return a single show or undefined if not found
function getShow(name) {
	Object.keys.forEach(function (showName) {
		if (name === showName) {
			return showList[showName];
		}
	});
	return undefined;
}
exports.getShow = getShow;

// Add a show to the show list
function addShow(newShow) {
	showList[newShow.nameOfShow] = {
		nextEpisode : newShow.nextEpisode,
		airDay : newShow.airDay,
		airTime : newShow.airTime,
		timezone : newShow.timezone,
		active : newShow.active
	}
	saveFile();
}
exports.addShow = addShow;

// Delete a show from the show list
function removeShow(showName) {
	delete showList[showName];
	saveFile();
}
exports.removeShow = removeShow;

// TODO Edit Show

function toggleActive(showName) {
	showList[showName].active = !showList[showName].active;
	saveFile();
}
exports.toggleActive = toggleActive;

// Load the showList from file (done on app load)
function loadShowList() {
	emitMessage("Looking for showList.json...");
	try {
		showList = JSON.parse(fs.readFileSync(`${process.cwd()}/data/${FILENAME}`));
		emitMessage("Found file, loaded data.");
	}
	catch (e) {
		console.log(e);
		emitMessage("No file found. Using a blank list.");
		showList = {};
	}
}
exports.loadShowList = loadShowList

// Returns name and time of show airing (active shows only)
function checkShowsOnDay(dayOfWeek) {
	let showsThatDay = [];
	Object.keys(showList).forEach(function (showName) {
		showList[showName].airDay.forEach(function (day) {
			if (day === dayMap[dayOfWeek]) {
				if (showList[showName].active) {
					showsThatDay.push([showName, showList[showName].airTime, showList[showName].timezone]);
				}
			}
		});
	});
	return showsThatDay;
}
exports.checkShowsOnDay = checkShowsOnDay;

module.exports = exports;