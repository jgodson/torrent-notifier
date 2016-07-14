const $ = jQuery = require("jquery");
const $status = $('#status');
const request = require('request');
const fs = require('fs');
const http = require('http');
const t = require('./torrent-notifier.js');

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
		if (!err) {
			t.emitMessage(`Got show info for ${nameOfShow} from tvmaze API...`);
			if (result.statusCode === 200) {
				let showInfo = {
					airTime : result.schedule.time,
					airDay : result.schedule.days,
					timezone : result.country.timezone
				}
				next(null, showInfo);
			}
		}
		else {
			t.emitMessage(`Could not get info for ${nameOfShow} from tvmaze API`);
			next('error');
		}
	});
}

function getImage(nameOfShow, next) {
	let localPath = `${process.cwd()}/data/images/${nameOfShow.replace(' ', '-')}.jpg`; // Path for file
	fs.readFile(localPath, function(err, data) {
		if (err) {
			t.emitMessage(`No local image for ${nameOfShow}, getting image...`);
			// Do a request for the show info
			request(`http://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(nameOfShow)}`, function(err, result) {
				if (!err) {
					t.emitMessage(`Got show info for ${nameOfShow} from tvmaze API...`);
					if (result.statusCode === 200) {
						// Then do a request for the image
						result = JSON.parse(result.body); // Parse the JSON in the body, we don't need the rest of the result object now
						download(result.image.original, localPath, function(err) {
							if (!err) {
								t.emitMessage(`Local image file created for ${nameOfShow}`);
								next(null);
							}
							else {
								t.emitMessage(`Could not get image for ${nameOfShow}`);
								next('error');
							}
						});
					}
					else {
						t.emitMessage(`Problem with show data for ${nameOfShow}. May be incorrect spelling.`);
						next('error');
					}
				}
				else {
					t.emitMessage(`Could not get info for ${nameOfShow} from tvmaze API`);
					next('error');
				}
			});
		}
		else {
			t.emitMessage(`Found local file for ${nameOfShow}`);
			next(null, localPath);
		}
	});
}
module.exports.getImage = getImage;

// Download image from given url to given path
function download(url, filePath, next) {
	// Check to see if there is a callback, set one if not
	if (!next) {
		next = (err) => console.log(err || 'done');
	}
	// Try to download file and catch any errors
	try {
		t.emitMessage(`Downloading image....`);
		// Create our file stream and request to given url
		var file = fs.createWriteStream(filePath);
		var req = request(url);

		// When response is received, capture response stream
		req.on('response', function(res) {
			// Write any data events to file
			res.on('data', function (chunk) {
					file.write(chunk);
			});

			// When response ends, close file and call callback function
			res.on('end',function(){
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

function convert12HrTime(givenTime) {
	let time = givenTime.split(':');
	let hour = time[0] > 12 ? time[0] - 12 : time[0];
	let minute = time[1];
	return `${hour}:${minute} ${time[0] > 12 ? 'PM' : 'AM'}`
}
module.exports.convert12HrTime = convert12HrTime;