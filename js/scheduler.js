'use strict'

const t = require('./torrent-notifier.js');
const schedule = require('node-schedule');
const tz = require('moment-timezone');
const moment = require('moment');
const LOCAL_TIMEZONE = moment.tz.guess();

// Interval to recheck when new episode isn't yet found mins * seconds * milliseconds
const CHECK_INTERVAL = 30 * 60 * 1000
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

// Keep track of scheduled Jobs
let scheduledJobs = {};

// Check again if no show was found
let checkIntervals = {};

function scheduleShow(nameOfShow) {
	let show = t.getShow(nameOfShow);
	let timeParts = show.airTime.split(':');
	let offset = (moment.tz.zone(LOCAL_TIMEZONE).offset(Date.now()) 
		- moment.tz.zone(show.timezone).offset(Date.now())) / 60;
	timeParts[0] -= offset + 1; // Show won't be ready until at least an hour after airing
	scheduledJobs[nameOfShow] = {};
	show.airDay.forEach( (day) => {
		addJob(nameOfShow, timeParts[0], timeParts[1], day);
	});
	t.emitMessage(`Scheduled check for ${nameOfShow}.`);
}
exports.scheduleShow = scheduleShow;

function addJob(nameOfShow, hour, minute, dayofweek) {
	let time = `${minute} ${hour} * * ${DAY_OF_WEEK[dayofweek]}`;
	scheduledJobs[nameOfShow][dayofweek] = schedule.scheduleJob(time, function(){
		t.checkForNewEpisode(nameOfShow, function (foundNewEpisode) {
			if (!foundNewEpisode) {
				addIntervalCheck(nameOfShow);
			}
		});
	});
}

function cancelShow(nameOfShow) {
	t.emitMessage(`Cancelling schedule for ${nameOfShow}.`);
	t.getShow(nameOfShow).airDay.forEach( (day) => {
			scheduledJobs[nameOfShow][day].cancel();
	});
	delete scheduledJobs[nameOfShow]
	clearIntervalCheck(nameOfShow);
}
exports.cancelShow = cancelShow;

function clearIntervalCheck(nameOfShow) {
	t.emitMessage(`Clearing interval checks for ${nameOfShow}.`);
	if (typeof checkIntervals[nameOfShow] !== 'undefined') {
		clearInterval(checkIntervals[nameOfShow].checks);
		delete checkIntervals[nameOfShow];
	}
}

function addIntervalCheck(nameOfShow) {
	t.emitMessage(`Adding interval check for ${nameOfShow}.`);
	checkIntervals[nameOfShow] = {
		retries : NUMBER_OF_RETRIES
	}
	checkIntervals[nameOfShow].checks = setInterval(function (nameOfShow) {
		t.emitMessage(`Checking for ${nameOfShow}. Retries left: ${checkIntervals[nameOfShow].retries}...`)
		t.checkForNewEpisode(nameOfShow, function(foundNewEpisode) {
			checkIntervals[nameOfShow].retries--;
			if (foundNewEpisode || checkIntervals[nameOfShow].retries === 0) {
				clearIntervalCheck(nameOfShow);
				return;
			}
		});
	}, CHECK_INTERVAL);
}

exports.scheduleAll = function scheduleAll() {
	let allShows = t.getShowList();
	Object.keys(allShows).forEach( (show) => {
		if (allShows[show].active) {
			scheduleShow(show);
		}
	});
	console.log(scheduledJobs);
}

module.exports = exports;