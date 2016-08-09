'use strict';

 // Do not require jQuery or shell if testing
 var $status;
 var $notificationBadge;
 var shell;
if(!global.it) {
  const $ = jQuery = require("jquery");
  $status = $('#status');
  $notificationBadge = $('#notification-badge');
  shell = require('electron').shell
}

const request = require('request');
const fs = require('fs');
const http = require('http');
const t = require('./torrent-notifier.js');
const moment = require('moment-timezone');
const LOCAL_TIMEZONE = moment.tz.guess();

// Extra time before torrent checks in scheduling
const EXTRA_HOURS = 1;
const EXTRA_MINUTES = 10;

const DAY_OF_WEEK = {
  "Sunday"    :   0,
  "Monday"    :   1,
  "Tuesday"   :   2,
  "Wednesday" :   3,
  "Thursday"  :   4,
  "Friday"    :   5,
  "Saturday"  :   6
}
exports.DAY_OF_WEEK = DAY_OF_WEEK;

function updateConnection (status) {
  $status.removeClass('ok error fa-check-circle-o fa-ban');
    $status.removeClass('spinning fa-circle-o-notch');
    if (status) {
      $('#connection i').addClass('ok fa-smile-o').removeClass('error fa-frown-o');
      $status.addClass('ok fa-check-circle-o').removeClass('error fa-ban');
      t.emitMessage("Connection status is: ONLINE");
    }
    else {
      $('#connection i').addClass('error fa-frown-o').removeClass('ok fa-smile-o');
      $status.addClass('error fa-ban').removeClass('ok fa-check-circle-o');
      t.emitMessage("Connection status is: OFFLINE");
    }
}
module.exports.updateConnection = updateConnection;

function getInfo(nameOfShow, next) {
  request(`http://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(nameOfShow)}`, function(err, result) {
    if (!err && result.statusCode === 200) {
      t.emitMessage(`Got result for ${nameOfShow} from tvmaze API.`);
      result = JSON.parse(result.body);
      let showInfo = {
        nameOfShow : result.name,
        airTime : result.schedule.time,
        airDay : result.schedule.days,
        timezone : result.network.country.timezone
      }
      if (result.image && (result.image.original || result.image.medium)) {
        showInfo.image = result.image.original || result.image.medium;
      }
      else {
        t.emitMessage(`No image source for ${nameOfShow}`);
      }
      next(null, showInfo);
    }
    else {
      t.emitMessage(`Could not get info for ${nameOfShow} from tvmaze API`);
      next('error');
    }
  });
}
module.exports.getInfo = getInfo;

function getImage(nameOfShow, url, next) {
  if (!next || typeof next !== 'function') {
    next = () => console.log('No next function given for getImage function');
  }
  //t.emitMessage(`Getting image for ${nameOfShow}`);
  let localPath = `${process.cwd()}/data/images/${nameOfShow.replace(/ /g, '-')}.jpg`; // Path for file
  fs.exists(localPath, function (exists) {
    if (!exists) {
      if (typeof url === 'string') {
        download(url, localPath, function(err) {
          if (err) { t.emitMessage(`Could not get image for ${nameOfShow}.`); }
          next(null, localPath);
        });
      }
      else {
        t.emitMessage(`No image found for ${nameOfShow} and no proper url was specified for download. Getting show info...`);
        getInfo(nameOfShow, function(err, info) {
          if (err || !info.image) {
            t.emitMessage(`Could not get info for ${nameOfShow}`);
            next('error');
          }
          else {
            download(info.image, localPath, function(err) {
              if (err) { t.emitMessage(`Could not get image for ${nameOfShow}.`); }
              next(null, localPath);
            });
          }
        });
      }
    }
    else {
      next(null, localPath);
    }
  });
}
module.exports.getImage = getImage;

// Download image from given url to given path
function download(url, filePath, next) {
  let totalSize = 0;
  // Check to see if there is a callback, set one if not
  if (!next) {
    next = (err) => console.log(err || 'done');
  }
  // Try to download file and catch any errors
  try {
    // Create our file stream and request to given url
    var file = fs.createWriteStream(filePath);
    var req = request(url);

    // When response is received, capture response stream
    req.on('response', function(res) {
      // Write any data events to file
      res.on('data', function (chunk) {
        totalSize += chunk.length;
        file.write(chunk);
      });

      // When response ends, close file and call callback function
      res.on('end', function(){
        t.emitMessage(`Successfully downloaded image. Size is ${(totalSize / 1024).toFixed(2)} kB`);
        file.end();
        next(null);
      });
    });
  }
  catch (e) {
    // On error event, delete the corrupt file if it exists
    fs.exists(filePath, function (exists) {
      if (exists) {
        fs.unlink(filePath, (err) => next('error'));
      }
      else {
        next('error');
      }
    });
  }
}

// Convert 24hr time into 12hr time, no timezones applied
function convert12HrTime(givenTime) {
  let time = convertTime(givenTime);
  let hour = time[0] > 12 ? time[0] - 12 : time[0] === 0 ? time[0] + 12 : time[0];
  let minute = time[1];
  return `${hour}:${minute < 10 ? `0${minute}` : minute} ${time[0] >= 12 ? 'PM' : 'AM'}`;
}
module.exports.convert12HrTime = convert12HrTime;

// Convert 24hr time to 12 hour time using timezone
function convertCalenderTime(givenTime, showName) {
  let show = t.getShow(showName);
  let time = convertTime(givenTime, show.timezone);
  let hour = time[0] > 12 ? time[0] - 12 : time[0] === 0 ? time[0] + 12 : time[0];
  let minute = time[1];
  if (time[2] !== 0) return 'Day Diff'; // If change in days, we can't switch days right now so do this.
  return `${hour}:${minute < 10 ? `0${minute}` : minute} ${time[0] >= 12 ? 'PM' : 'AM'}`
}
module.exports.convertCalenderTime = convertCalenderTime;

// Used for adjusting 24 hour time to timezone or adding extra time for scheduling
function convertTime(showTime, showTimezone, scheduler) {
  let timeParts = showTime.split(':');
  // Make each an integer
  timeParts[0] = parseInt(timeParts[0]);
  timeParts[1] = parseInt(timeParts[1]);
  let dayDiff = 0; // If we roll over previous/next day
  // Calculate time zone offset
  let timeNow = Date.now();
  if (showTimezone) {
    let offset = (moment.tz.zone(LOCAL_TIMEZONE).offset(timeNow)
      - moment.tz.zone(showTimezone).offset(timeNow)) / 60;
    timeParts[0] -= offset;
  }
  if (scheduler) {
    // Schedule check some extra time after air time
    timeParts[0] += EXTRA_HOURS;
    timeParts[1] += EXTRA_MINUTES;
  }
  // Check to see if minutes rolled over
  if (timeParts[1] > 60) {
    timeParts[0] += 1;
    timeParts[1] -= 60;
  }
  // Check to see if hour rolled over
  if (timeParts[0] < 0) {
    dayDiff -= 1;
    timeParts[0] += 24
  }
  if (timeParts[0] >= 24) {
    dayDiff += 1;
    timeParts[0] -= 24;
  }
  timeParts.push(dayDiff);
  return timeParts; // return an array of the values
}

// Use convert time function with schedule option set to true that adds extra time
function getSchedulerTime (showTime, showTimezone) {
  return convertTime(showTime, showTimezone, true);
}
module.exports.getSchedulerTime = getSchedulerTime;

// Change day of week by days given as second argument
function changeDay(day, dayDiff) {
  // adjust for offset
  day = DAY_OF_WEEK[day] + dayDiff;
  // if day > 6?, day - 6 // else: if day < 0?, day + 6 // else: no change
  return day > 6 ? day -= 6 : day < 0 ? day += 6 : day;
}
module.exports.changeDay = changeDay;

// Reverse lookup an object. Given value, get key.
function getKeyByValue(object, value) {
  if (typeof object !== 'object') throw new TypeError('First paramater "object" must be an object');
  if (typeof value === 'undefined') throw new Error('Second paramater "value" must be given');
  return Object.keys(object).find((key) => object[key] === value);
}
module.exports.getKeyByValue = getKeyByValue;

function updateNotificationBadge(numNotifications) {
  $notificationBadge.text(numNotifications);
  if (numNotifications === 0) {
    $notificationBadge.fadeOut();
  }
  else {
    $notificationBadge.fadeIn();
  }
}
module.exports.updateNotificationBadge = updateNotificationBadge;

function openExternalMagnet(link) {
  console.log(`open:${link}`);
  shell.openExternal(link);
}
module.exports.openExternalMagnet = openExternalMagnet;
