const cloudantClient = require('@cloudant/cloudant');
const config = require('nconf');
const path = require('path');
let instance = null;

class Cloudant {
  //console.log('cloudnat Constructor');
  constructor() {
    // static instance;
    if (!instance) {
      config.file(path.join('./', 'config', 'app.json'));
      let VCAP_SERVICES = config.get('VCAP_SERVICES');
      VCAP_SERVICES = typeof VCAP_SERVICES === 'string' ? JSON.parse(VCAP_SERVICES) : VCAP_SERVICES;

      console.log(JSON.stringify(VCAP_SERVICES));
      if (VCAP_SERVICES === undefined) {
        const URL = process.env.CLOUDANT_URL;
        console.log(URL);

        this.cloudant = new cloudantClient({
          url: URL,
          maxAttempt: 5,
          plugins: ['promises', { retry: { retryErrors: false, retryStatusCodes: [429] } }],
        });
      } else {
        console.log(VCAP_SERVICES);
        const URL = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.url;
        console.log(URL);

        this.cloudant = new cloudantClient({
          url: URL,
          maxAttempt: 5,
          plugins: ['promises', { retry: { retryErrors: false, retryStatusCodes: [429] } }],
        });
        // this.cloudant = cloudantClient({
        //   vcapServices: VCAP_SERVICES,
        //   plugin: 'promises',
        // }); // eslint-disable-line new-cap
      }

      instance = this;
    }

    return instance;
  }

  get(name) {
    return this.cloudant.db.get(name);
  }

  create(name) {
    return this.cloudant.db.create(name);
  }

  use(name) {
    return this.cloudant.db.use(name);
  }
}

module.exports = new Cloudant();
