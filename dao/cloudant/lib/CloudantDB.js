/* eslint no-underscore-dangle: "off" */

'use strict';

// const uuid = require('uuid');
const cloudant = require('./Cloudant');
const logger = require('../../../logger')('cloudant');

class CloudantDB {
  constructor(databaseName) {
    this.databaseName = databaseName;
    this.cloudant = cloudant;
    this.initialized = new Promise(resolve => {
      this.cloudant
        .create(this.databaseName)
        .then(() => {
          logger.debug(`database ${this.databaseName} created`);
          this.db = this.cloudant.use(this.databaseName);
          resolve();
        })
        .catch(error => {
          logger.debug(error);
          this.db = this.cloudant.use(this.databaseName);
          resolve();
        });
    });
  }

  createIndex(name, fields) {
    const index = { name, type: 'json', index: { fields } };
    this.initialized
      .then(() => this.db.index(index))
      .then(result => logger.debug(`Index creation result: ${result.result}`))
      .catch(err => logger.error(err));
  }

  createView(designDoc, view, mapFunction, reduceFunction, orderFunction) {
    const _id = `_design/${designDoc}`; // eslint-disable-line no-underscore-dangle
    return this.initialized
      .then(() => this.get(_id))
      .catch(err => {
        logger.error(`error: ${JSON.stringify(err)}`);
        logger.debug(`could not find ${_id}`);
        logger.debug(`trying to create ${_id}`);
        return this.save({ _id });
      })
      .then(result => {
        logger.debug(`updating ${_id} for ${view}`);
        return this.update(`_design/${designDoc}`, {
          views: Object.assign({}, result.views, {
            [view]: {
              map: mapFunction,
              reduce: reduceFunction,
              order: orderFunction,
            },
          }),
          language: 'javascript',
        });
      })
      .then(result => logger.debug(`view ${view} created successfully (${JSON.stringify(result)})`))
      .catch(err => logger.error(err));
  }

  info() {
    return this.cloudant.get(this.databaseName);
  }

  get(id) {
    return this.db.get(id);
  }

  save(doc) {
    return new Promise((resolve, reject) => {
      this.db
        .insert(doc)
        .then(result => {
          resolve(Object.assign(doc, result));
        })
        .catch(err => {
          reject(err);
        });
    });
    // return promise.then().catch(err => {
    //   logger.error(err);
    // });
  }

  update(id, doc) {
    const docToSave = Object.assign({}, doc);
    if (docToSave._rev) {
      delete docToSave._rev;
    }

    if (!id) {
      return this.db.insert(docToSave);
    }

    return this.db
      .get(id)
      .then(dbDoc => this.db.insert(Object.assign({}, dbDoc, docToSave)), () => this.db.insert(docToSave));
  }

  delete(id) {
    return this.db.get(id).then(doc => this.db.destroy(doc._id, doc._rev));
  }

  getAttachmentCallback(key, data, callback) {
    this.db.attachment.get(key, data, (err, body) => {
      callback(err, body);
    });
  }

  getAttachment(key, data) {
    return this.db.attachment.get(key, data);
  }

  insertAttachment(key, prop, data, contentType) {
    return this.db.attachment.insert(key, prop, data, contentType);
  }

  insertAttachmentCallback(key, prop, data, contentType, opt, callback) {
    logger.debug(key, prop, data, contentType, opt, callback);
    logger.debug(data);

    this.db.attachment.insert(key, prop, data, contentType, opt).then((erre, body) => {
      callback(erre, body);
    });
  }

  list(params) {
    return this.db.list(params);
  }

  find(selector) {
    return this.db.find(selector);
  }

  view(design, view, key) {
    return this.db.view(design, view, key || {});
  }

  search(design, search, key) {
    return this.db.search(design, search, key || {});
  }

  multiPartSave(data, file, key) {
    return this.db.multipart.insert(data, file, key || {});
  }

  multiPartUpdate(docToSave, file, key) {
    return this.db
      .get(docToSave.id)
      .then(data => {
        return this.db.attachment.destroy(docToSave.id, `${Object.keys(data._attachments)[0]}`, { rev: data._rev });
      })
      .then(data => {
        return this.db.attachment.insert(docToSave.id, file[0].name, file[0].data, file[0].content_type, {
          rev: data.rev,
        });
      })
      .then(data => {
        delete docToSave.rev;
        delete docToSave.id;

        return this.update(data.id, docToSave);
      });
  }

  getAll() {
    return this.db.list({ include_docs: true }).then(data => {
      console.log(JSON.stringify(data));
      return data.rows.map(item => item.doc);
    });
  }

  bulk(docs, key) {
    return this.db.bulk({ docs: docs }, key || {});
  }
}

module.exports = CloudantDB;
