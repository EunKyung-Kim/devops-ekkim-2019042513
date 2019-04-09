const express = require('express');
const app = express();

const logger = require('./logger')('server');
const nconf = require('nconf');
require('dotenv').config();

const configServer = require('./init');

const startApp = app => {
  const port = process.env.VCAP_APP_PORT || process.env.PORT || nconf.get('port');
  app.listen(port, () => {
    logger.info(`Express server listening on port ${port}`);
  });
};

configServer(app, __dirname);
startApp(app);
