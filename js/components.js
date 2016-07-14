const utils = require('./utils.js');
const t = require('./torrent-notifier.js');
const moment = require('moment');

var exports = {};

function buildShow(showName, currentShow, next) {
	utils.getImage(showName, function(err, image) {
		if (err) {
			image = `${process.cwd()}/data/images/noimage.jpeg`;
		}
		next(`<div class='showListing'><img src='${image}' />
	<div class='info' data='${showName}'>
		<div class='showTitle'>${showName}</div>
		<div class='infoButton activeButton${currentShow.active ? ' active' : ''}' title="Toggle Active"><i class="fa fa-star"></i></div>
		<div class='infoButton edit' title="Edit Show"><i class="fa fa-pencil"></i></div>
		<div class='infoButton delete' title="Delete Show"><i class="fa fa-trash-o"></i></div>
	</div>
</div>`);
	});
}
exports.buildShow = buildShow;

function buildShowList (next) {
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
exports.buildShowList = buildShowList;

function buildCalendar() {
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
	<div class='showTimeOnDay dayInfo'>${utils.convert12HrTime(showsToday[curr][1])}</div>`;
			}
			htmlCalendar += "</div>";
			day++;
			// End loop if we reach the required days in the month (+1 since we increment first)
			if (day === daysInMonth + 1) {
				break;
			}
		}
		htmlCalendar += "</div>";
	}
	return htmlCalendar;
}
exports.buildCalendar = buildCalendar;

function buildBatteryLevel(batteryLevel) {
	batteryLevel *= 100;
	batteryLevel = Math.round(batteryLevel);
	let levels = [10, 30, 50, 90];
	levels.push(batteryLevel);
	levels = levels.sort( (a, b) => a > b );
	return `<i class="fa fa-battery-${levels.indexOf(batteryLevel)}"></i><div>${batteryLevel}%</div>`;
}
exports.buildBatteryLevel = buildBatteryLevel;

// TODO Make NEW/Edit dialog
function buildDialog(showName) {
	if (showName) {
		showInfo = t.getShow(showName);
	}
	dialog = `<div id='dialog'>
	<div class='dialog-title'>${showName ? 'Editing ' + showName : 'Add new show'}</div>
	<div class='dialog-body'`;
}

module.exports = exports;