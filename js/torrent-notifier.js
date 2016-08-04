'use strict'

// Do not require jQuery or electron stuff if testing
var $;
var shell;
if (!global.it) {
  $ = jQuery = require("jquery");
  shell = require('electron').shell
}

const fs = require('fs');
const request = require('request');
const EventEmitter = require('events');
const notifier = require('node-notifier');
const fileOps = require('./fileOps.js');
const toaster = require('./toaster.js');

// Create a new EventEmitter
const torrentAlerter = new EventEmitter();

// Specify File Name for show list file
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
  return (function(data) {
    let newEpisodeFound = false;
    let results = [];
    // Set up what we are searching for
    let searchTerms = [showList[currentShow].nextEpisode];
    searchTerms[1] = showList[currentShow].nextEpisode.split('E').join(' ')
      .replace('S', '').replace(' ', 'x').replace('0', '');
    searchTerms[2] = showList[currentShow].nextEpisode.toLowerCase();
    /* 
      Loop through the results for this show. Starting at the least recent result
      so that if user is a few episodes behind, it should find them all 
    */
    for(let i = 1 ; i < Object.keys(data).length ; i++) {
      console.log(data[i].title);

      // If a new episode was found, update the search terms and search the list again
      if (newEpisodeFound) {
        searchTerms = [showList[currentShow].nextEpisode];
        searchTerms[1] = showList[currentShow].nextEpisode.split('E').join(' ')
          .replace('S', '').replace(' ', 'x').replace('0', '');
        searchTerms[2] = showList[currentShow].nextEpisode.toLowerCase();
        newEpisodeFound = false; // Reset new episode found so we update again if new found.
        i = 1; // Start from the first result again
      }

      // Loop through search terms to see if is in the title of this result
      for(let term = 0; term < searchTerms.length ; term++) {
        if (data[i].title.indexOf(searchTerms[term]) > 0) {
          emitMessage(`New Episode of ${currentShow} found!`);
          emitMessage(`${searchTerms[term]} matched ${data[i].title}`);

          // Add some info for notification
          data[i].showName = currentShow;
          data[i].episodeFound = showList[currentShow].nextEpisode;

          // Trigger the desktop notification
          newEpisodeAlert(data[i]);
          newEpisodeFound = true;
          results.push(data[i]);

          // Update nextEpisode to what should be the next episode
          showList[currentShow].nextEpisode = incrementEpisode(showList[currentShow].nextEpisode);
          saveShows();
          break;
        }
      }
    }
    return results;
  })(data);
}

// Triggered to log given message to GUI console
torrentAlerter.on('message', function(message) {
  $('#console').append(`<p>${new Date().toString()} - ${message}</p>`);
  console.log(message);
});

// Check API for given show name
exports.checkForNewEpisode = function checkForNewEpisode(show, type, next) {
  const settings = require('./settings.js');
  if (settings.getSetting('Check For Torrents') || type === 'manual') {
    emitMessage(`Searching for new episodes of ${show}...`);
    // Make request to torrent API
    request(`https://torrentproject.se/?s=${encodeURIComponent(show)}&out=json&orderby=latest&num=50`, function(err, result) {
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

// Show notification center notification or task bar notification on Windows
function newEpisodeAlert(torrentInfo) {
  // TODO: Keep the result in a list in app so windows user can download. 
  // Also only show click to download notification on osx because Windows doesn't work
  const settings = require('./settings.js');
  if (settings.getSetting('Notifications')) {
    notifier.notify({
      'title': `${torrentInfo.episodeFound} of ${torrentInfo.showName} available!`,
      'sound': true,
      'message': 'Click this notification to download',
      'open': `magnet:?xt=urn:btih:${torrentInfo.torrent_hash}`
    });
  }
  else {
    emitMessage(`New episode of ${torrentInfo.showName} available. Notifications are turned off.`);
    toaster.showToast('Notifications are turned off');
  }
  // If automatic downloads are turned on, download torrent immediately
  if(settings.getSetting('Automatic Downloads')) {
    emitMessage('Automatic downloads are turned on.');
    emitMessage(`New episode of ${torrentInfo.showName} available. Opening magnet link...`);
    if(shell.openExternal(`magnet:?xt=urn:btih:${torrentInfo.torrent_hash}`)) {
      emitMessage('Magnet link was opened successfully. Check your torrent client.');
    }
    else {
      emitMessage('Something went wrong while opening external link.');
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
}

// Delete a show from the show list
exports.removeShow = function removeShow(showName) {
  delete showList[showName];
  saveShows();
}

// Changes a setting from on -> off or vice versa
exports.toggleActive = function toggleActive(showName) {
  showList[showName].active = !showList[showName].active;
  saveShows();
  return showList[showName].active;
}

// Load the showList from file (done on app load)
exports.loadShowList = function loadShowList() {
  try {
    showList = JSON.parse(fs.readFileSync(`${process.cwd()}/data/${FILENAME}`));
    emitMessage("Found show list file. Loaded shows.");
  }
  catch (e) {
    emitMessage("No show list file found. Using a blank list.");
    showList = {};
  }
}

// Returns true or false depending if a given show is active or not
exports.isActive = function isActive(nameOfShow) {
  return showList[nameOfShow].active;
}

// Returns name and time (plus timezoen) of show airing (active shows only)
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