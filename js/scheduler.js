'use strict'

const t = require('./torrent-notifier.js');
const schedule = require('node-schedule');
const tz = require('moment-timezone');
const utils = require('./utils.js');
const moment = require('moment');
const LOCAL_TIMEZONE = moment.tz.guess();

// Interval to recheck when new episode isn't yet found 
const CHECK_INTERVAL = 15; // minutes
// How many times to check torrent API before giving up
const NUMBER_OF_RETRIES = 4;

const DAY_OF_WEEK = utils.DAY_OF_WEEK; // import day of week object

var exports = {};

// Keep track of scheduled Jobs (TV show air dates)
let scheduledJobs = {};

// Keep track of interval scheduler jobs (when torrents aren't found)
let intervalJobs = {};

// Build schedule to show and then send it to scheduler function
function scheduleShow(nameOfShow) {
  let show = t.getShow(nameOfShow);
  if (show.active) { // Only schedule if it's active
  // timeParts will be array returned from function [hour, minute, dayChange]
  let timeParts = utils.getSchedulerTime(show.airTime, show.timezone);
  scheduledJobs[nameOfShow] = {};
  show.airDay.forEach( (day) => { // Add each airing day of show to schedule
    day = utils.changeDay(day, timeParts[2]);
    addJob(nameOfShow, timeParts[0], timeParts[1], day);
    t.emitMessage(
      `Scheduled check for ${nameOfShow} for ${utils.getKeyByValue(DAY_OF_WEEK, day)} @ ` +
      `${utils.convert12HrTime(`${timeParts[0]}:${timeParts[1]}`)}`
    );
  });
  }
}
exports.scheduleShow = scheduleShow;

// Add job to scheduler
function addJob(nameOfShow, hour, minute, dayofweek) {
  let time = `${minute} ${hour} * * ${dayofweek}`;
  scheduledJobs[nameOfShow][utils.getKeyByValue(DAY_OF_WEEK, dayofweek)] = 
    schedule.scheduleJob(time, function(){
      t.checkForNewEpisode(nameOfShow, 'auto', function (results) {
        if (results.length === 0) {
          addIntervalCheck(nameOfShow);
        }
    });
  });
}

// Remove show from scheduler
function cancelShow(nameOfShow) {
  t.emitMessage(`Cancelling all jobs for ${nameOfShow}.`);
  let showToCancel = t.getShow(nameOfShow);
  // timeParts will be array returned from function [hour, minute, dayChange]
  let timeParts = utils.getSchedulerTime(showToCancel.airTime, showToCancel.timezone);
  showToCancel.airDay.forEach((day) => {
    // Change day if the time difference adjusted the scheduled day
    day = utils.getKeyByValue(DAY_OF_WEEK, utils.changeDay(day, timeParts[2])); // Make it string value
    // Make sure that show is scheduled before trying to cancel
    if (typeof scheduledJobs[nameOfShow] !== 'undefined') {
      scheduledJobs[nameOfShow][day].cancel();
    }
    else {
      t.emitMessage(`No scheduled jobs found for ${nameOfShow}`);
    }
  });
  delete scheduledJobs[nameOfShow] // Won't cause error so can be here
  clearIntervalCheck(nameOfShow);
}
exports.cancelShow = cancelShow;

// Remove show from interval check schedule
function clearIntervalCheck(nameOfShow) {
  t.emitMessage(`Clearing interval job for ${nameOfShow}.`);
  // Check if there is an interval job scheduled first
  if (typeof intervalJobs[nameOfShow] !== 'undefined') {
    intervalJobs[nameOfShow].nextCheck.cancel();
    delete intervalJobs[nameOfShow];
  }
  else {
    t.emitMessage(`No interval jobs were scheduled for ${nameOfShow}`);
  }
}

// Add show to interval check schedule
function addIntervalCheck(nameOfShow) {
  t.emitMessage(`No new episode found. Adding interval job for ${nameOfShow}.`);
  if (!intervalJobs[nameOfShow]) { // Check if interval job was scheduled already
    intervalJobs[nameOfShow] = { // create new job
      retries : NUMBER_OF_RETRIES
    }
  }
  // Schedule the check
  let time = moment().add(CHECK_INTERVAL, 'minutes'); // add the required wait time
  let job_time = `${time.minute()} ${time.hour()} * * ${time.day()}`;
  intervalJobs[nameOfShow].nextCheck = schedule.scheduleJob(job_time, function() {
    intervalJobs[nameOfShow].retries--; // subtract for each try
    t.emitMessage(`Checking for ${nameOfShow}. Retries left: ${intervalJobs[nameOfShow].retries}...`);
    t.checkForNewEpisode(nameOfShow, 'auto', function (results) {
      // Schedule again if no new episode and retries left
      if (!(results.length > 0 || intervalJobs[nameOfShow].retries === 0)) {
        intervalJobs[nameOfShow].nextCheck.cancel(); // cancel what is there now
        addIntervalCheck(nameOfShow); // add the new check
      }
      else { // or cancel if found new episode or no retries left
        clearIntervalCheck(nameOfShow);
      }
    });
  });
}

// Schedule all shows in show list. (Done on app load)
exports.scheduleAll = function scheduleAll() {
  let allShows = t.getShowList();
  Object.keys(allShows).forEach( (show) => {
    scheduleShow(show);
  });
}

module.exports = exports;