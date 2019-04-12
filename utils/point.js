const logger = require('../logger')('point');
const pointDAO = require('../dao/point');
const weather = require('../utils/weather');
const moment = require('moment');

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

class Point {
  constructor() {}

  pointCalucurate(data) {
    logger.debug('point');
    logger.debug(data);
    weather
      .dbquery('SELECT * FROM t_weather WHERE wth_t_target = ? ORDER BY wth_idx DESC', [
        moment(new Date()).format('YYYY/MM/DD'),
      ])
      .then(results => {
        point.weather = results[0].wth_activity_index === 'bad' ? false : true;
        return true;
      })
      .then(() => {
        if (data.age) {
          point.age.value = data.age.value;
          if (data.age.value <= 24) point.age.point = 1;
          else if (data.age.value < 75) point.age.point = 2;
          else if (data.age.value >= 75) point.age.point = 3;
        }
        logger.debug(data);
        if (data.step) {
          point.step.value = data.step.value;
          if (weather) {
            if (data.step.value <= 5000) point.step.point = 1;
            else if (data.step.value <= 7500) point.step.point = 2;
            else if (data.step.value > 7500) point.step.point = 3;
          } else {
            if (data.step.value <= 4000) point.step.point = 1;
            else if (data.step.value <= 6500) point.step.point = 2;
            else if (data.step.value > 6500) point.step.point = 3;
          }
        }

        if (data.hrm) {
          point.hrm.value = data.hrm.value;
          if (weather) {
            if (data.hrm.value <= 50 || data.hrm.value >= 100) point.hrm.point = 1;
            else if (data.hrm.value > 50 && data.hrm.value <= 80) point.hrm.point = 2;
            else if (data.hrm.value > 80 && data.hrm.value <= 100) point.hrm.point = 3;
          } else {
            if (data.hrm.value <= 40 || data.hrm.value >= 90) point.hrm.point = 1;
            else if (data.hrm.value > 40 && data.hrm.value <= 70) point.hrm.point = 2;
            else if (data.hrm.value > 70 && data.hrm.value <= 90) point.hrm.point = 3;
          }
        }

        point.total = point.hrm.point + point.age.point + point.step.point + point.food.point;
        point.date = data.date;
        point.uid = data.uid;
        // HISTORY DB에 저장
        console.log(point);

        // 1. date_userid 문서가 존재 하는지 확인
        pointDAO
          .get(`${moment(new Date()).format('YYYYMMDD')}_${point.uid}`)
          .then(ret => {
            // 2-1. 만약 있다면 업데이트
            logger.debug('point exist');
            point.food = ret.food;
            point.total = point.hrm.point + point.age.point + point.step.point + point.food.point;
            //point._rev = ret._rev;
            //point._id = ret._id;

            pointDAO
              .update(`${moment(new Date()).format('YYYYMMDD')}_${data.uid}`, point)
              .then(ret => {
                logger.debug('update success');
              })
              .catch(err => {
                logger.debug(err);
              });
          })
          .catch(err => {
            // 2-2. 만약 없다면 새로 생성
            logger.debug(`${moment(new Date()).format('YYYYMMDD')}_${data.uid}`);
            point._id = `${moment(new Date()).format('YYYYMMDD')}_${data.uid}`;
            pointDAO.save(point);
          });

        return data;
      })
      .catch(err => {
        logger.debug(err);
      });
  }

  getPoint(data) {}
}

module.exports = new Point();
