'use strict';

const utils = require('./utils.js');
const t = require('./torrent-notifier.js');
const moment = require('moment');
const settings = require('./settings.js');

// Image src to use when no image found
const DEFAULT_IMAGE = `${process.cwd()}/data/images/noimage.jpg`;

var exports = {};

// Build a single show listing
function buildShow(showName, currentShow, next) {
  utils.getImage(showName, null, function(err, image) {
    if (err) {
      image = DEFAULT_IMAGE;
    }
    next(`<div class='showListing'><img src='${image}' />
  <div class='info' data='${showName}'>
    <div class='showTitle'>${showName}</div>
    <div class='infoButton activeButton${currentShow.active ? ' active' : ''}' title="Toggle Active">
      <i class="fa fa-star"></i>
    </div>
    <div class='infoButton edit' title="Edit Show"><i class="fa fa-pencil"></i></div>
    <div class='infoButton delete' title="Delete Show"><i class="fa fa-trash-o"></i></div>
    <div class='downloadButton' title="Check Now"><i class='fa fa-cloud-download'></i></div>
  </div>
</div>`);
  });
}
exports.buildShow = buildShow;

// Build show list collection page and return it 
exports.buildShowList = function buildShowList (next) {
  let htmlList = "";
  let showList = t.getShowList();
  var numShows = Object.keys(showList).length;
  if (numShows > 0) {
    Object.keys(showList).sort( (a, b) => a < b ).forEach(function (showName) {
      let currentShow = showList[showName];
      buildShow(showName, currentShow, function(thisShow) {
        htmlList += thisShow !== undefined ? thisShow : showName;
        numShows--;
        if (numShows === 0) {
          next(htmlList);
        }
      });
    });
  }
  else {
    next("<p>Nothing to see here! Add some shows by clicking the + button</p>");
  }
}

/*
  TODO Build calendar and then build showonday components to get proper days
  if timezone changes day
*/
exports.buildCalendar = function buildCalendar() {
  let today = new Date();
  let monthNames = {
    0 : "January",
    1 : "February",
    2 : "March",
    3 : "April",
    4 : "May",
    5 : "June",
    6 : "July",
    7 : "August",
    8 : "September",
    9 : "October",
    10 : "November",
    11 : "December"
  }
  let stop = false; // when to stop building days
  // Initialize variable to store html and Add month name to top of Calendar
  let htmlCalendar = `<div id='monthName'>${monthNames[today.getMonth()]}</div>`;
  // Add Weekday labels to top of Calendar
  htmlCalendar += "<div class='labels'>";
  let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  daysOfWeek.forEach(function (label) {
    htmlCalendar += `<div><span>${label}</span></div>`;
  });
  htmlCalendar += "</div>";
  let daysInMonth = moment().daysInMonth();
  let firstWeek = true;
  let monthStartsOn = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  for(let day = 1; day <= daysInMonth;) {
    htmlCalendar += "<div class='week'>";
    // Pad with blank days to make it look a bit better
    if (firstWeek) {
      for (let numSpaces = monthStartsOn; numSpaces > 0; numSpaces--) {
        htmlCalendar += "<div class='blank'></div>";
      }
    }
    for (let dayofweek = firstWeek ? monthStartsOn : 0; dayofweek <= 6; dayofweek++) {
      firstWeek = false;
      htmlCalendar += `<div class='day ${day === today.getDate() ? "today'" : "'"}><span>${day}</span>`;
      let showsToday = t.checkShowsOnDay(dayofweek);
      for (let curr = 0; curr < showsToday.length; curr++) {
        htmlCalendar += `<div class='showOnDay dayInfo'>${showsToday[curr][0]}</div>
  <div class='showTimeOnDay dayInfo'>${utils.convertToCalenderTime(showsToday[curr][1], showsToday[curr][0])}</div>`;
      }
      htmlCalendar += "</div>";
      // End loop if we reach the required days in the month
      if (day === daysInMonth) {
        stop = true;
      }
      if (stop) break;
      day++;
    }
    if (stop) break;
    htmlCalendar += "</div>";
  }
  return htmlCalendar;
}

// Build battery indicator html and return
exports.buildBatteryLevel = function buildBatteryLevel(batteryLevel) {
  batteryLevel *= 100;
  batteryLevel = Math.round(batteryLevel);
  let levels = [10, 30, 50, 90];
  levels.push(batteryLevel);
  levels = levels.sort( (a, b) => a > b );
  return `<i class="fa fa-battery-${levels.indexOf(batteryLevel)}"></i><div>${batteryLevel}%</div>`;
}

// Build new/edit show dialog box
exports.buildDialog = function buildDialog(showName) {
  let showInfo;
  if (showName) {
    showInfo = t.getShow(showName);
  }
  return `<div class='setting' id='dialog'>
  <div class='title'><span>${showName ? 'Editing ' + showName : 'Add new show'}</span>
    <div class='close-dialog' id='close-btn'><i class='fa fa-times-circle-o'></i></div>
  </div>
  <div class='body'>
    <div class='input-row'>
      <label>Show Name</label>
      <span id='request-status'><i class='fa fa-circle-o-notch fa-spin'></i></span>
      <input name='show-name' type='text' placeholder='Name of show'${showName ? `value="${showName}"` : ' '}>
    </div>
    <div class='input-row'>
      <label>Next Episode (S##E##)</label>
      <input name='next-episode' type='text' placeholder='S01E01'${showName ? `value="${showInfo.nextEpisode}"` : ' '}>
    </div>
    <div class='input-row'>
      <label>Air Day</label>
      <input name='air-day' type='text' placeholder='Monday, Wednesday, Friday'${showName ? `value="${showInfo.airDay}"` : ' '}>
    </div>
    <div class='input-row'>
      <label>Air Time</label>
      <input name='air-time' type='time' placeholder='8:00PM'${showName ? `value="${showInfo.airTime}"` : ' '}>
    </div>
    <div class='input-row'>
      <label>Airing Timezone</label>
      <input name='timezone' type='text' placeholder='Start typing to search...'${showName ? `value="${showInfo.timezone}"` : ' '}>
    </div>
    <div class='input-row'>
        <label>Currently Airing</label>
        <form>
          <input name='active' type='radio' value='1'${showName ? showInfo.active ? 'checked' : ' ' : 'checked'}>Yes
          <input name='active' type='radio' value='0'${showName ? showInfo.active ? ' ' : 'checked' : ' '}>No
        </form>
    </div>
    <div id='dialog-errors'>Next Episode format incorrect</div>
    <div class='dialog-buttons'>
      <button class='button close-dialog' id='cancel-btn'>Cancel</button>
      <button class='button' id='save-btn'>Save</button>
    </div>
  </div>`;
}

// Build settings page and return
exports.buildSettings = function buildSettings() {
  let settingsHtml = "";
  let allSettings = settings.getAllSettings();
  Object.keys(allSettings).forEach(function (thisSetting) {
    settingsHtml += buildSetting(thisSetting);
  });
  return settingsHtml;
}

// Build single setting box
function buildSetting(name) {
  return `<div class='setting'>
    <div class='title'><span>${name}</span></div>
    <div class='body'>
      <div class='switch-container'>
        <input data-setting='${name}' type='checkbox' class='on-off-button' ${settings.getSetting(name) ? 'checked' : ''}>
          <label>
            <i class='fa fa-power-off'></i>
          </label>
        </input>
      </div>
    </div>
  </div>`;
}

module.exports = exports;