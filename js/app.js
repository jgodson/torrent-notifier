const utils = require('./utils.js');
const uiComp = require('./components.js');
const t = require('./torrent-notifier.js');
const settings = require('./settings.js');
const $ = jQuery = require('jquery');
const ipc = require('electron').ipcRenderer

// When app loads do these initially
t.loadShowList(); // Load list of shows from file
settings.loadSettings(); // Load settings from file

// Do initial connection check
utils.updateConnection(navigator.onLine);

// Add event listeners to update connection status
window.addEventListener('online', () => utils.updateConnection(true));
window.addEventListener('offline', () => utils.updateConnection(false));

// Add Tray Icon if setting is set
if (settings.getSetting('Tray Icon')) {
	ipc.send('put-in-tray');
}

// Check if device has a battery
navigator.getBattery().then((battery) => {
	// If no battery, do not add battery indicator
	if (battery) {
		$('#battery').html(uiComp.buildBatteryLevel(battery.level));
		battery.addEventListener('levelchange', () => {
			$('#battery').html(uiComp.buildBatteryLevel(battery.level));
		});
	}
});

