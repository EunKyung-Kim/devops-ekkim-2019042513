const Client = require('ibmiotf');
const logger = require('../logger')('ibmiotf');
const delay = require('delay');
const sleep = require('sleep');
const pointDAO = require('../dao/point');
const pointUtil = require('../utils/point');
const moment = require('moment');

const appClientConfig = {
  org: 'x01xog',
  id: 'KBLI-startup',
  domain: 'internetofthings.ibmcloud.com',
  'auth-key': 'a-x01xog-lvljjuhifr',
  'auth-token': 'YwT*oa3prpQTUuHEnI',
};

let appClient = null;
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

class IoTPlatformManager {
  constructor() {
    appClient = new Client.IotfApplication(appClientConfig);
    appClient.connect();

    appClient.on('connect', function() {
      logger.debug('onConnect');
      appClient.subscribeToDeviceEvents();
    });

    appClient.on('deviceEvent', function(deviceType, deviceId, eventType, format, payload) {
      if (eventType === 'band_data') {
        const data = JSON.parse(payload);
        logger.debug(data);
        // band.uid = data.uid;
        // band.band.steps = data.band.step;
        // band.band.hrm = data.band.hrm;
        // band.band.age = data.band.age;

        point._id = `${moment(new Date()).format('YYYYMMDD')}_${data.uid}`;
        point.date = `${moment(new Date()).format('YYYYMMDD')}`;
        point.uid = data.uid;

        point.age.value = data.band.age;
        point.step.value = data.band.step;
        point.hrm.value = data.band.hrm;

        pointUtil.pointCalucurate(point);
      }
    });
  }

  getBandData(id) {
    return band;
  }

  getPoint(data) {}
}

module.exports = new IoTPlatformManager();
