/* eslint no-underscore-dangle: "off" */

'use strict';

const CloudantDB = require('./cloudant').CloudantDB;

class User extends CloudantDB {
  constructor() {
    super('user');
    this.init();
  }

  init() {}
}

module.exports = new User();
