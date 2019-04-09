/* eslint no-underscore-dangle: "off" */

'use strict';

const CloudantDB = require('./cloudant').CloudantDB;

class Band extends CloudantDB {
  constructor() {
    super('band');
    this.init();
  }

  init() {}
}

module.exports = new Band();
