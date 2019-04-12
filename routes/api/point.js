'use strict';

const express = require('express');
const logger = require('../../logger')('point');
const pointDAO = require('../../dao/point');
const _ = require('underscore');

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

  const point = {
    _id: '',
    uid: '',
    age: {
      point: 0,
      value: 0,
    },
    step: {
      point: 0,
      value: 0,
    },
    hrm: {
      point: 0,
      value: 0,
    },
    food: {
      point: 0,
      foods: [],
    },
    weather: false,
    total: 0,
    date: '',
  };

  /**
   * @swagger
   *
   * /point:
   *   get:
   *     tags:
   *       - point
   *     description: Get point data
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.get('/', (req, res) => {
    logger.info('GET - get point data...');
    res.send({});
  });

  /**
   * @swagger
   *
   * /point/{uid}:
   *   get:
   *     tags:
   *       - point
   *     description: Get point data
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
  router.get('/:uid/:month', (req, res) => {
    logger.info('GET - get point data from user...');
    logger.info(req.params.uid);
    pointDAO
      .search('app', 'search', {
        q: `uid:${req.params.uid} AND date:[2019${req.params.month}01* TO 2019${req.params.month}31*]`,
        include_docs: true,
      })
      .then(ret => {
        console.log(ret);
        res.send(ret);
      })
      .catch(err => {});
  });

  /**
   * @swagger
   *
   * /point/{id}:
   *   post:
   *     tags:
   *       - point
   *     description: Add point data
   *     parameters:
   *     - in: path
   *       name: id
   *       description: user ID
   *       required: true
   *     - in: body
   *       name: body
   *       description: Relation object
   *       required: true
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.post('/:id', (req, res) => {
    logger.info('POST - put point data');
    logger.debug(req.params.id);
    logger.debug(req.body);

    // 1. date_userid 문서가 존재 하는지 확인
    pointDAO
      .get(req.params.id)
      .then(data => {
        // 2-1. 만약 있다면 업데이트
        logger.debug(data);
        res.send({});
      })
      .catch(err => {
        // 2-2. 만약 없다면 새로 생성

        res.send({});
      });
  });

  /**
   * @swagger
   *
   * /point/food/{id}:
   *   post:
   *     tags:
   *       - point
   *     description: Add point data
   *     parameters:
   *     - in: path
   *       name: id
   *       description: user ID
   *       required: true
   *     - in: body
   *       name: body
   *       description: Relation object
   *       required: true
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.post('/food/:id', (req, res) => {
    logger.info('POST - put point data');
    logger.debug(req.params.id);
    logger.debug(req.body);

    // 1. date_userid 문서가 존재 하는지 확인
    pointDAO
      .get(req.params.id)
      .then(data => {
        // 2-1. 만약 있다면 업데이트
        logger.debug('Food point exist');
        logger.debug(data);
        data.food.point += req.body.results.point;
        data.food.foods = _.union(data.food.foods, req.body.results.foods);

        logger.debug('length : ' + data.food.foods.length);
        if (data.food.foods.length <= 2) {
          logger.debug('point 1');
          data.food.point = 1;
        } else if (data.food.foods.length <= 6) {
          logger.debug('point 2');
          data.food.point = 2;
        } else if (data.food.foods.length >= 7) {
          logger.debug('point 3');
          data.food.point = 3;
        }

        logger.debug(data);
        data.total = data.food.point + data.age.point + data.step.point + data.hrm.point;

        delete data._id;
        delete data._rev;

        pointDAO.update(req.params.id, data).then(data => {
          res.send(data);
        });
      })
      .catch(err => {
        // 2-2. 만약 없다면 새로 생성
        logger.debug('Food point not exist');
        point._id = req.params.id;
        point.food = req.body.results;
        point.date = req.params.id.split('_')[0];
        point.uid = req.params.id.split('_')[1];
        if (point.food.foods.length <= 2) point.food.point = 1;
        else if (point.food.foods.length <= 6) point.food.point = 2;
        else if (point.food.foods.length > 7) point.food.point = 3;

        point.total = point.food.point;

        pointDAO.save(point).then(data => {
          res.send(data);
        });
      });
  });

  return router;
};
