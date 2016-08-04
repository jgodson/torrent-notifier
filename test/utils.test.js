const utils = require('../js/utils.js');
const assert = require('assert');

describe('utils module tests', function() {
  describe('convert12HrTime function', function() {
    it('Given "22:00" should return "10:00 PM"', function() {
      assert.equal(utils.convert12HrTime('22:00'), '10:00 PM');
    });

    it('Given "12:00" should return "12:00 PM"', function() {
      assert.equal(utils.convert12HrTime('12:00'), '12:00 PM');
    });

    it('Given "00:00" should return "12:00 AM"', function() {
      assert.equal(utils.convert12HrTime('00:00'), '12:00 AM');
    });

    it('Given "09:59" should return "9:59 AM"', function() {
      assert.equal(utils.convert12HrTime('09:59'), '9:59 AM');
    });

    it('Given "00:09" should return "12:09 AM"', function() {
      assert.equal(utils.convert12HrTime('00:09'), '12:09 AM');
    });
  });
});