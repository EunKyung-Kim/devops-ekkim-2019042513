'use strict';

const express = require('express');
const logger = require('../../logger')('visual');
const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
const fs = require('fs');
const visualRecognition = new VisualRecognitionV3({
  url: 'https://gateway.watsonplatform.net/visual-recognition/api',
  version: '2018-03-19',
  iam_apikey: 'kyMBKQcNqVJZHaK7t2n14L6FT7mmTHdMZQ2mYGz_vOYE',
});
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const _ = require('underscore');

module.exports = middlewares => {
  const router = express.Router(); // eslint-disable-line new-cap
  const foods = ['egg', 'blueberry', 'broccoli', 'nut', 'red wine', 'salmon', 'tomato'];
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
   * /visual:
   *   post:
   *     tags:
   *       - visual
   *     description: Get visual recognition data
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: image_file
   *         type: file
   *         description: The file to upload.
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  router.post('/classify', upload.single('image_file'), (req, res) => {
    logger.info('POST - Visual Recognition data...');

    console.log(req.file);
    const params = {};

    if (req.file) {
      params.images_file = fs.createReadStream(req.file.path);
    }

    visualRecognition.classify(params, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(JSON.stringify(result, null, 2));
        const point = getFoodPoint(result);
        res.send(point);
      }
    });
  });

  const getFoodPoint = body => {
    const result = { results: { point: 0, food: [] } };
    const scoreLevel = 0.5;
    const imageClass = body.images[0].classifiers[0].classes;

    for (var i = 0; i < imageClass.length; i++) {
      if (imageClass[i].score > scoreLevel) {
        for (var j = 0; j < foods.length; j++) {
          if (imageClass[i].type_hierarchy) {
            console.log(imageClass[i]);
            if (
              imageClass[i].class.toLowerCase().includes(foods[j]) &&
              (imageClass[i].type_hierarchy.includes('food') ||
                imageClass[i].type_hierarchy.includes('fruit') ||
                imageClass[i].type_hierarchy.includes('plant'))
            ) {
              console.log(imageClass[i]);
              result.results.food.push(foods[j]);
            }
          }
        }
      }
    }

    result.results.food = _.uniq(result.results.food);
    result.results.point = result.results.food.length;

    return result;
  };

  return router;
};
