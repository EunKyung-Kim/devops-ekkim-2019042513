'use strict';

const express = require('express');
const logger = require('../../logger')('drones');
const iotf = require('../../iotf/iotmanager');
const errorHandler = require('../../utils/errorHandler');

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

  /**
   * @swagger
   *
   * /band:
   *   get:
   *     tags:
   *       - band
   *     description: Get band data
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.get('/', (req, res) => {
    logger.info('GET - get band data...');
    res.send(iotf.getBandData());
    // get band data from iot_simulator
  });

  return router;
};
