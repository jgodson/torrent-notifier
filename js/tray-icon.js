const path = require('path');
const electron = require('electron');
const ipc = electron.ipcMain;
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;

let appIcon = null;

ipc.on('put-in-tray', function (event) {
  const iconName = process.platform === 'win32' ? '../data/icons/app-icon-md.png' : '../data/icons/app-icon-sm.png';
  const iconPath = path.join(__dirname, iconName);
  
  // Check to make sure app icon does not exist so we don't make more than one (Great for electron-reload)
  if (!appIcon) {
    appIcon = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([{
      label: 'Remove',
      click: function () {
        event.sender.send('tray-removed');
        appIcon.destroy();
        appIcon = null;
      }
    }]);
    appIcon.setToolTip('Torrent Notifier');
    appIcon.setContextMenu(contextMenu);
  }
});

ipc.on('remove-tray', function () {
  appIcon.destroy();
  appIcon = null;
});

app.on('window-all-closed', function () {
  // Leave icon for OSX
  if (process.platform !== 'darwin') {
    if (appIcon) appIcon.destroy();
  }
});