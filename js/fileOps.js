'use strict';

const fs = require('fs');

// Create the object to export
var exports = {};

// Loads data from file and returns it
exports.loadFile = function loadFile(filename) {
	try {
		let fileData = JSON.parse(fs.readFileSync(`${process.cwd()}/data/${filename}`));
		return fileData;
	}
	catch (e) {
		return undefined;
	}
}

// Saves data to file and returns true or false depending on whether it was successful
exports.saveFile = function saveFile(filename, data) {
	try {
		fs.writeFileSync(`data/${filename}`, JSON.stringify(data));
		return true;
	}
	catch (e) {
		return false;
	}
}

module.exports = exports;