'use strict';

const bodyParser = require('body-parser');
const path = require('path');
const nconf = require('nconf');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../logger')('init');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const swaggerDefinition = {
  info: {
    // API informations (required)
    title: 'KBLI-Startup', // Title (required)
    version: '0.0.1', // Version (required)
    description: 'KBLI Startup Application', // Description (optional)
  },
  host: '', // Host (optional)
  basePath: '/api/v1', // Base path (optional)
};

const options = {
  swaggerDefinition,
  apis: ['./routes/api/*.js', './config/tags.yaml', './config/definitions.yaml'],
};

const swaggerSpec = swaggerJSDoc(options);

console.log(swaggerSpec);

const initConfig = (app, baseDir) => {
  nconf.env().argv();
  if (app.get('env') === 'development') {
    nconf.file(app.get('env'), path.join(baseDir, 'config', 'app-development.json'));
  }
  nconf.file(path.join(baseDir, 'config', 'app.json'));
};

const initMiddlewares = (app, baseDir) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(helmet());
  app.use(morgan('dev'));
  app.use('/logs', express.static('logs'));
  app.use('/', express.static('public'));
  app.use(cors());
};

const initRoutes = app => {
  const user = require('../routes/api/user');
  const point = require('../routes/api/point');
  const weather = require('../routes/api/weather');
  const visual = require('../routes/api/visual');
  const band = require('../routes/api/band');
  const API_VERSION = nconf.get('API_VERSION');

  app.use(`${API_VERSION}/user`, user());
  app.use(`${API_VERSION}/point`, point());
  app.use(`${API_VERSION}/weather`, weather());
  app.use(`${API_VERSION}/visual`, visual());
  app.use(`${API_VERSION}/band`, band());
  // Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // error handling
  app.use((err, req, res) => {
    // eslint-disable-line no-unused-vars
    logger.error(err);
    res.status(500).send({
      error: true,
      message: err.uiMessage,
    });
  });
};

const init = (app, dirname) => {
  initConfig(app, dirname);
  initMiddlewares(app, dirname);
  initRoutes(app, dirname);
};

module.exports = init;
