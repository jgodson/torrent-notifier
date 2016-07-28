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

const DAY_OF_WEEK = {
  "Sunday"    :   0,
  "Monday"    :   1,
  "Tuesday"   :   2,
  "Wednesday" :   3,
  "Thursday"  :   4,
  "Friday"    :   5,
  "Saturday"  :   6
}

var exports = {};

// Keep track of scheduled Jobs (TV show air dates)
let scheduledJobs = {};

// Keep track of interval scheduler jobs (when torrents aren't found)
let intervalJobs = {};

// Build schedule to show and then send it to scheduler function
function scheduleShow(nameOfShow) {
  let show = t.getShow(nameOfShow);
  if (show.active) { // Only schedule if it's active
    let timeParts = show.airTime.split(':');
    let timeNow = Date.now();
    let offset = (moment.tz.zone(LOCAL_TIMEZONE).offset(timeNow) 
      - moment.tz.zone(show.timezone).offset(timeNow)) / 60; // Calculate time zone offset
    timeParts[0] = parseInt(timeParts[0]) - offset + 1; // Show won't be ready until at least an hour after airing
    timeParts[1] = parseInt(timeParts[1]) + 10; // 1 hour 10 mins after airing show may be ready
    scheduledJobs[nameOfShow] = {};
    show.airDay.forEach( (day) => { // Add each airing day of show to schedule
      addJob(nameOfShow, timeParts[0], timeParts[1], day);
      t.emitMessage(`Scheduled check for ${nameOfShow} for ${day} @ ` +
      `${utils.convert12HrTime(`${timeParts[0]}:${timeParts[1]}`, null, false)}`);
    });
  }
}
exports.scheduleShow = scheduleShow;

// Add job to scheduler
function addJob(nameOfShow, hour, minute, dayofweek) {
  let time = `${minute} ${hour} * * ${DAY_OF_WEEK[dayofweek]}`;
  scheduledJobs[nameOfShow][dayofweek] = schedule.scheduleJob(time, function(){
    t.checkForNewEpisode(nameOfShow, 'auto', function (foundNewEpisode) {
      if (!foundNewEpisode) {
        addIntervalCheck(nameOfShow);
      }
    });
  });
}

// Remove show from scheduler
function cancelShow(nameOfShow) {
  t.emitMessage(`Cancelling all jobs for ${nameOfShow}.`);
  t.getShow(nameOfShow).airDay.forEach( (day) => {
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
    t.checkForNewEpisode(nameOfShow, 'auto', function (foundNewEpisode) {
      // Schedule again if no new episode and retries left
      if (!(foundNewEpisode || intervalJobs[nameOfShow].retries === 0)) {
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