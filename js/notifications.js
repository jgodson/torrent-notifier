'use strict';

var exports = {};

const moment = require('moment');
const utils = require('./utils.js');

let notifications = [];

var Notification = function Notification(message, magnet) {
  this.id = generateID();
  this.message = message;
  this.magnet = magnet;
  this.time = moment().format('ddd MMM Do, YYYY hh:mm A');
  this.html = `<div class='notification' data-id='${this.id}'>
    <i class='fa fa-cloud-download'></i>
    <div class='notification-content'>
      <div><span>${this.message}</span></div>
      <div class='notification-time'>${this.time}</div>
    </div>
    <div class='notification-actions'>
      <span class='notification-download' onclick='notificationDownload(event)'>Download</span>
      <span class='notification-dismiss' onclick='notificationDismiss(event)'>Dismiss</span>
    </div>
  </div>`
}

// Generates a unique number to use for notification id
function generateID() {
  let unique = false;
  let id = notifications.length + 1;
  while(!unique) {
    if(getNotification(id)) {
      id++;
    }
    else {
      unique = true;
    }
  }
  return id;
}

// Creates a new notification object and adds it to the array using given
// message and magnet link
exports.addNotification = function addNotification(message, magnet) {
  let notification = new Notification(message, magnet);
  notifications.push(notification);
  return notification.id;
}

// Removes notification with given id from array. Returns true if successful
// and false if not
exports.removeNotification = function removeNotification(id) {
  for (var index = 0; index < notifications.length; index++) {
    if (notifications[index].id == id) {
      notifications.splice(index, 1);
      return true;
    }
  };
  return false;
}

// Returns a single notification with given id, or false if not found
function getNotification(id) {
  for (var index = 0; index < notifications.length; index++) {
    if (notifications[index].id == id) {
      return notifications[index];
    }
  };
  return false;
}
exports.getNotification = getNotification;

// Returns length of notification array
exports.getNumberOfNotifications = function getNumberOfNotifications() {
  return notifications.length;
}

// Returns notification array
exports.getAllNotifications = function getAllNotifications() {
  return notifications;
}

// Get notification of given id and then open the magnet link of that object
exports.startDownload = function startDownload(id) {
  let current = getNotification(id);
  utils.openExternalMagnet(current.magnet);
}

// Update the badge on the notification button in the UI
function updateNotificationBadge() {
  utils.updateNotificationBadge(notifications.length);
}
exports.updateNotificationBadge = updateNotificationBadge;

module.exports = exports;
