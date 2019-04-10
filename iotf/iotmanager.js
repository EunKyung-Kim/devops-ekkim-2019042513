const Client = require('ibmiotf');
const logger = require('../logger')('ibmiotf');
const delay = require('delay');
const sleep = require('sleep');

const appClientConfig = {
  org: 'x01xog',
  id: 'KBLI-startup',
  domain: 'internetofthings.ibmcloud.com',
  'auth-key': 'a-x01xog-lvljjuhifr',
  'auth-token': 'YwT*oa3prpQTUuHEnI',
};

let appClient = null;
const band = {
  steps: 0,
  hrm: 0,
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
        band.steps = data.stepCount;
        band.hrm = data.avgHeartRate;
      }
    });
  }

  getBandData(id) {
    return band;
  }
}

module.exports = new IoTPlatformManager();
