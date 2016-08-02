const fileOps = require('../js/fileOps');
const assert = require('assert');
const fs = require('fs');

describe('fileOps', function() {
  const testObj = {
    testing : true,
    issues : false
  }
  
  after(function() {
    // Remove file and directory used for testing
    fs.unlinkSync(`${process.cwd()}/data/test/test.json`);
    fs.rmdirSync(`${process.cwd()}/data/test`);
  }); 

  it('should indicate that "test" directory does not exist', function() {
    assert.equal(fileOps.checkDirectory('test'), false);
  });

  it('should create the "test" directory', function() {
    assert.equal(fileOps.createDirectory('test'), true);
  });

  it('should now indicate that "test" directory does exist', function() {
    assert.equal(fileOps.checkDirectory('test'), true);
  });

  it('should indicate "test.json" file not found', function() {
    assert.equal(fileOps.loadFile('test/test.json'), false);
  });

  it('should create "test.json" file', function() {
    assert.equal(fileOps.saveFile('test/test.json', testObj), true);
  });

  it('should read file and equal what was originally given', function() {
    assert.deepEqual(fileOps.loadFile('test/test.json'), testObj);
  });
});