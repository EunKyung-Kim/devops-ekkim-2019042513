'use strict';

const express = require('express');
const logger = require('../../logger')('weather');

module.exports = middlewares => {
  const router = express.Router(); // eslint-disable-line new-cap

  if (middlewares) {
    middlewares.forEach(middleware => router.use(middleware));
  }

  const parseData = data => {
    return data.rows.map(record => ({
      id: record.doc._id,
      rev: record.doc._rev,
    }));
  };

  return router;
};
