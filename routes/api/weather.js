'use strict';

const express = require('express');
const logger = require('../../logger')('weather');
const weather = require('../../utils/weather');
const moment = require('moment');
const momentz = require('moment-timezone');

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
   * /weather:
   *   get:
   *     tags:
   *       - weather
   *     description: Get weather data
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.get('/getWeather', (req, res) => {
    console.log(
      momentz(new Date())
        .tz('Asia/Seoul')
        .format('YYYY/MM/DD/HH/MM/DD')
    );
    weather
      .dbquery('SELECT * FROM t_weather WHERE wth_t_target = ? ORDER BY wth_idx DESC', [
        momentz(new Date())
          .tz('Asia/Seoul')
          .format('YYYY/MM/DD'),
      ])
      .then(results => {
        if (results.length > 0) {
          res.send(results);
        } else {
          res.send('{"ERROR": "오늘 데이터가 존재하지 않음"}');
        }
      })
      .catch(err => {
        res.send('ERROR: ' + err.toString());
      });
  });

  return router;
};
