'use strict'

const fs = require('fs');
const request = require('request');
const EventEmitter = require('events');
const notifier = require('node-notifier');
const fileOps = require('./fileOps.js');
const $ = jQuery = require("jquery");
const toaster = require('./toaster.js');
const shell = require('electron').shell

// Create a new EventEmitter
const torrentAlerter = new EventEmitter();

// Specify File Name
const FILENAME = 'showList.json';

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

// Variable to store list of shows user is interested in
let showList; // undefined until loadShowList is called

// Module exports object
var exports = {};

// ---- Event Listeners ----
// Triggered when request has new results from API
function parseData(data, currentShow) {
	let newEpisodeFound = false;
	return (function(data) {
		console.log(data);
		// Loop through the results for this show
		for(let i = Object.keys(data).length - 1; i > 0; i--) {
			// Check to see if the new episode is in the title of this result
			console.log(data[i].title);
			if (data[i].title.indexOf(showList[currentShow].nextEpisode) !== -1) {
				emitMessage(`New Episode of ${currentShow} found!`);
				data[i].showName = currentShow;

				// Triger the desktop notification
				newEpisodeAlert(data[i]);
				newEpisodeFound = true;

				// Update nextEpisode to what should be the next episode
				showList[currentShow].nextEpisode = incrementEpisode(showList[currentShow].nextEpisode);
				saveShows();
			}
		}
		return newEpisodeFound;
	})(data);
}

// Triggered to log given message to GUI console
torrentAlerter.on('message', function(message) {
	$('#console').append(`<p>${new Date().toString()} - ${message}</p>`);
	console.log(message);
});

// Check API for given show name
exports.checkForNewEpisode = function checkForNewEpisode(show, next) {
	const settings = require('./settings.js');
	if (settings.getSetting('Check For Torrents')) {
		emitMessage(`Searching for new episodes of ${show}...`);
		// Make request to torrent API
		request(`https://torrentproject.se/?s=${encodeURIComponent(show)}&out=json&orderby=latest`, function(err, result) {
			// Trigger event to deal with data from API call if request was OK
			if (!err && result.statusCode === 200) {
				next(parseData(JSON.parse(result.body), show));
			}
			else {
				// If error log to UI console that request was not successful
				emitMessage(`Request to API for ${show} was unsuccessful.`);
				toaster.showToast(`Request to API for ${show} was unsuccessful. Check the show name.`);
				next(false);
			}
		});
	}
	else {
		emitMessage('Torrent checks are turned off');
		toaster.showToast('Torrent checks are turned off');
		next(true); // Return true so that interval checks arent started
	}
}

// Show notification center notification
function newEpisodeAlert(torrentInfo) {
	const settings = require('./settings.js');
	if (settings.getSetting('Notifications')) {
		notifier.notify({
			'title': `New Episode of ${torrentInfo.showName} available!`,
			'sound': true,
			'message': 'Click to download top result',
			'open': `magnet:?xt=urn:btih:${torrentInfo.torrent_hash}`
		});
	}
	else {
		emitMessage(`New episode of ${torrentInfo.showName} available. Notifications are turned off.`);
		toaster.showToast('Notifications are turned off');
	}
	if(settings.getSetting('Automatic Downloads')) {
		emitMessage('Automatic downloads are turned on....');
		emitMessage(`New episode of ${torrentInfo.showName} available. Opening magnet link...`);
		if(shell.openExternal(`magnet:?xt=urn:btih:${torrentInfo.torrent_hash}`)) {
			emitMessage('Magnet link was opened successfully. Check your torrent client.');
		}
		else {
			emitMessage('Torrent client not found. Please check to make sure it is associated with magnet links.');
		}
	}
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
function saveShows() {
	if(fileOps.saveFile(FILENAME, showList)) {
		emitMessage('Show list saved to file successfully');
	}
	else {
		emitMessage('Error saving show list to file');
		toaster.showToast('Error saving show list to file');
	}
}
exports.saveShows = saveShows;

// Return entire show list
exports.getShowList = function getShowList() {
	return showList;
}

// Return a single show or undefined if not found
exports.getShow = function getShow(name) {
	return showList[name];
}

// Add a show to the show list
exports.addShow = function addShow(newShow) {
	showList[newShow.nameOfShow] = {
		nextEpisode : newShow.nextEpisode,
		airDay : newShow.airDay,
		airTime : newShow.airTime,
		timezone : newShow.timezone,
		active : newShow.active
	}
	saveShows();
	toaster.showToast(`${newShow.nameOfShow} successfully added to list!`);
}

// Delete a show from the show list
exports.removeShow = function removeShow(showName) {
	delete showList[showName];
	saveShows();
}

// TODO Edit Show
exports.showEdit = function showEdit(name, newData) {

}

exports.toggleActive = function toggleActive(showName) {
	showList[showName].active = !showList[showName].active;
	saveShows();
}

// Load the showList from file (done on app load)
exports.loadShowList = function loadShowList() {
	try {
		showList = JSON.parse(fs.readFileSync(`${process.cwd()}/data/${FILENAME}`));
		emitMessage("Found show list file, loaded data.");
	}
	catch (e) {
		emitMessage("No show list file found. Using a blank list.");
		showList = {};
	}
}

// Returns name and time of show airing (active shows only)
exports.checkShowsOnDay = function checkShowsOnDay(dayOfWeek) {
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

module.exports = exports;