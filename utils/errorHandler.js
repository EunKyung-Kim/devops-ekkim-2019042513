const logger = require('../logger')('createErrMsg');

class ErrorMessage extends Error {
  constructor() {
    super();
  }

  createErrorMsg(err) {
    delete this.stack;

    // Cloudant Error
    if (err.reason) {
      logger.info('cloudant Error');
      this.message = err.reason || 'Error';
      this.statusCode = err.statusCode;
      this.statusText = err.error || 'Error';
    } else if (err.isJoi) {
      logger.info('validation error');
      this.statusCode = 400;
      this.statusText = err.name;
      this.message = err.details[0].message;
    } else if (err.statusText) {
      logger.info('IoTP Error');
      // IoTP Error
      this.statusCode = err.status;
      this.message = err.data.message;
      this.statusText = err.statusText;
    } else {
      this.statusCode = err.code;
      this.message = err.msg;
      this.statusText = err.text;
    }

    return this;
  }
}

module.exports = new ErrorMessage();
