/* eslint no-underscore-dangle: "off" */

'use strict';

const CloudantDB = require('./cloudant').CloudantDB;

class Visual extends CloudantDB {
  constructor() {
    super('visual');
    this.init();
  }

  init() {}
}

module.exports = new Visual();
