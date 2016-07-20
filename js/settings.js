'use strict'

const fs = require('fs');
const t = require('./torrent-notifier.js');
const fileOps = require('./fileOps.js');
const ipc = require('electron').ipcRenderer
const event = require('events');
const toaster = require('./toaster.js');

const FILENAME = 'settings.json';

// Set the default settings TODO: seperate file?
const defaultSettings = {
	"Tray Icon" : true,
	"Notifications" : true,
	"Automatic Downloads" : false,
	"Auto Show Search" : true,
	"Check For Torrents" : true
};

// module settings List
let settingsList = {};

// Set up exports object
var exports = {};

// Loads settings from file to local variable
exports.loadSettings = function loadSettings() {
	settingsList = fileOps.loadFile(FILENAME);
	if (settingsList) {
		t.emitMessage('Successfully loaded settings file');
	}
	else {
		t.emitMessage('No settings file found, loading default settings');
		settingsList = defaultSettings;
	}
}

// Saves local variable to JSON file
function saveSettings() {
	if (fileOps.saveFile(FILENAME, settingsList)) {
		t.emitMessage('Successfuly saved current settings to file');
	}
	else {
		t.emitMessage('Error saving settings to file');
		toaster.showToast('Error saving settings to file.')
	}
}
exports.saveSettings = saveSettings;

// Gets a single setting
exports.getSetting = function getSetting(name) {
	return settingsList[name];
}

// Gets entire settings List
exports.getAllSettings = function getAllSettings() {
	return settingsList;
}

// Flips a settings value (true -> false, false -> true)
exports.toggleSetting = function toggleSetting(name) {
	settingsList[name] = !settingsList[name];
	// Check if settings is the tray icon setting and add/remove from tray
	if (name === 'Tray Icon') {
		if (settingsList[name]) {
			ipc.send('put-in-tray');
		}
		else {
			ipc.send('remove-tray');
		}
	}
	saveSettings();
}

module.exports = exports;