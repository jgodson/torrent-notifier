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

// Check to make sure images directory exists. If not, create it
exports.checkImagesDirectory = function checkImagesDirectory() {
  try {
    fs.statSync(`${process.cwd()}/data/images`);
  }
  catch (e) {
    fs.mkdirSync(`${process.cwd()}/data/images`);
  }
}

module.exports = exports;