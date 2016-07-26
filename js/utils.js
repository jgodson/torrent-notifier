const $ = jQuery = require("jquery");
const $status = $('#status');
const request = require('request');
const fs = require('fs');
const http = require('http');
const t = require('./torrent-notifier.js');
const moment = require('moment-timezone');
const LOCAL_TIMEZONE = moment.tz.guess();

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
      console.log(result);
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
      res.on('end',function(){
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

function convert12HrTime(givenTime, showName, useOffset = true) {
  let now = Date.now();
  let offset = null;
  if (useOffset) {
    let show = t.getShow(showName);
    offset = (moment.tz.zone(LOCAL_TIMEZONE).offset(now) 
      - moment.tz.zone(show.timezone).offset(now)) / 60;
  }
  let time = givenTime.split(':');
  let hour = time[0] > 12 ? time[0] - 12 : time[0];
  let minute = time[1];
  hour -= offset || 0;
  return `${hour}:${minute} ${time[0] > 12 ? 'PM' : 'AM'}`
}
module.exports.convert12HrTime = convert12HrTime;