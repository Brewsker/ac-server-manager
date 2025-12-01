/**
 * Controllers Index
 * 
 * Exports all controller modules for easy importing.
 * 
 * @module controllers
 */

const configController = require('./configController');
const serverController = require('./serverController');
const contentController = require('./contentController');
const entryListController = require('./entryListController');

module.exports = {
  configController,
  serverController,
  contentController,
  entryListController
};
