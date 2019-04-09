const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    everything: { type: 'dateFile', filename: './logs/log.log' },
  },
  categories: {
    default: { appenders: ['out', 'everything'], level: process.env.logLevel ? process.env.logLevel : 'debug' },
  },
});

module.exports = name => {
  const logger = log4js.getLogger(`${name}`);
  return logger;
};
