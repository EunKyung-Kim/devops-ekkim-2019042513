/* eslint no-underscore-dangle: "off" */

'use strict';

const CloudantDB = require('./cloudant').CloudantDB;

class Point extends CloudantDB {
  constructor() {
    super('point');
    this.init();
  }

  init() {}
}

module.exports = new Point();
