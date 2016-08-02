'use strict';

const fs = require('fs');

// Create the object to export
var exports = {};

// Loads data from file and returns it
exports.loadFile = function loadFile(filename) {
  try {
    return JSON.parse(fs.readFileSync(`${process.cwd()}/data/${filename}`));
  }
  catch (e) {
    return false;
  }
}

// Saves data to file and returns true or false depending on whether it was successful
exports.saveFile = function saveFile(filename, data) {
  try {
    fs.writeFileSync(`${process.cwd()}/data/${filename}`, JSON.stringify(data));
    return true;
  }
  catch (e) {
    return false;
  }
}

// Check to make sure given directory exists.
exports.checkDirectory = function checkDirectory(dirname) {
  try {
    fs.statSync(`${process.cwd()}/data/${dirname}`);
  }
  catch (e) {
    return false;
  }
  return true;
}

// Create directory with given name
exports.createDirectory = function createDirectory(dirname) {
  try {
    fs.mkdirSync(`${process.cwd()}/data/${dirname}`);
  }
  catch (e) {
    return false;
  }
  return true;
}

module.exports = exports;