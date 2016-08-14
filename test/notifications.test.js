const notifications = require('../js/notifications.js');
const assert = require('assert');

describe('notifications module tests', function() {
  it('getAllNotifications should return an empty array', function() {
    assert.equal(notifications.getAllNotifications().length, 0);
  });

  it('add {message : "hello", magnet: "www.google.com"} to array', function() {
    notifications.addNotification('hello', 'www.google.com');
    assert.equal(notifications.getNumberOfNotifications(), 1);
  });

  it('getting notification with "id" of 1 should return object', function() {
    assert.equal(typeof notifications.getNotification(1), 'object');
  });

  it('should have "message" value of "hello"', function() {
    assert.equal(notifications.getNotification(1).message, "hello");
  })

  it('should have a "magnet" value of "www.google.com"', function() {
    assert.equal(notifications.getNotification(1).magnet, "www.google.com");
  });

  it('should have generated a "time" value', function() {
    assert.equal(typeof notifications.getNotification(1).time, 'string');
  });

  it('should have generated a "html" value', function() {
    assert.equal(typeof notifications.getNotification(1).html, 'string');
  });

  it('should remove notification with "id" of 1', function() {
    notifications.removeNotification(1);
    assert.equal(notifications.getNotification(1), false);
  });
});
