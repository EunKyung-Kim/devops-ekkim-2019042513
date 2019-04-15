'use strict';

const express = require('express');
const multer = require('multer');
const logger = require('../../logger')('user');
const userDAO = require('../../dao/user');
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
   * /user/{uid}:
   *   get:
   *     tags:
   *       - user
   *     description: Get user data
   *     parameters:
   *     - in: path
   *       name: uid
   *       description: user ID
   *       required: true
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.get('/:uid', (req, res) => {
    logger.info('GET - get user data...');
    userDAO
      .get(req.params.uid)
      .then(ret => {
        res.send(ret);
      })
      .catch(err => {
        res.send(ret);
      });
  });

  return router;
};
