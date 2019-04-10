/*
	소스
*/
var request = require('request');
var moment = require('moment');
var mysql = require('mysql');
var cron = require('node-cron');

// DB 연결 (IBM Cloud 꺼)
const db = mysql.createConnection({
  host: 'sl-us-south-1-portal.48.dblayer.com',
  port: 21267,
  database: 'kyobo',
  charset: 'utf8',
  user: 'admin',
  password: 'GHAZIVWSNTRZZZTG',
  /*
        ssl: {
            ca: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURlekNDQW1PZ0F3SUJBZ0lFWEsxSDBUQU5CZ2txaGtpRzl3MEJBUTBGQURBL01UMHdPd1lEVlFRREREUmkKWlc5dGMydHBiVUJyY2k1cFltMHVZMjl0TFdWak5qQXdPVGhrT0dSak9UWXhNR1ZsWkRBNVpESmpNMlV5WW1aaQpNV1l6TUI0WERURTVNRFF4TURBeE16TXdOVm9YRFRNNU1EUXhNREF4TURBd01Gb3dQekU5TURzR0ExVUVBd3cwClltVnZiWE5yYVcxQWEzSXVhV0p0TG1OdmJTMWxZell3TURrNFpEaGtZemsyTVRCbFpXUXdPV1F5WXpObE1tSm0KWWpGbU16Q0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQUwzcWM2YWJPY1BpRjgyWQpua3ZZK2Jvek9ITkRsTzBJWXFiWjM3eDM3RWlTSGFmai9qdzYwWVhqaTFBNmdOdEZNcWk5cVpIZ2RwN0UwbHJCCk8reWZFeDIzaHFsRFBXK0FqRS9tZWNyRHFJOXAwaCtlWnExR0w4Q1NVUm9Wd0R5cm9QK0VNUHRIWk1ENHVvclAKTndTZDgxbXRYdVpDYWJlc0JUUWRYSW02Rk52cXQ1ZVdBc3dFSUpWNnZyUDlTeTBLT21yVEJjMDI3WjdZMklUOQoxTlArVkJwMk5QVTlhcTh5Kzc2S2d5NXliVzBXT0sxcDZuZjRGT0kxbWlqdHpYM3dyRStNYWtjVUFmek9uMHZCCk4zMm1DMnB5ZWFwMkJOUFVvUGJrWm9tL0YweUgvNHQ2WkNoWU9udlNCMWxlYjVVeFlHQzhmZENYTmJzL0p0ODEKR244cVozMENBd0VBQWFOL01IMHdIUVlEVlIwT0JCWUVGSkFmZXhQVklWNlRtMmw5aFYvc0praEk3dVN5TUE0RwpBMVVkRHdFQi93UUVBd0lDQkRBZEJnTlZIU1VFRmpBVUJnZ3JCZ0VGQlFjREFRWUlLd1lCQlFVSEF3SXdEQVlEClZSMFRCQVV3QXdFQi96QWZCZ05WSFNNRUdEQVdnQlNRSDNzVDFTRmVrNXRwZllWZjdDWklTTzdrc2pBTkJna3EKaGtpRzl3MEJBUTBGQUFPQ0FRRUFPaEhLR1pxS3Nqd3BNUVVYOWxONWMwRU1ENnRxanlYSmRORU55S1RPeUF5ZQpvV1RtT2ZQeC9mZ1Btd0NvZWRlVjBnWlRwTWc4ejRDd0dQc2d6OUphYVJ5RzgwMlh1WVhTdUpYcUE5ZnpIWjZKCjZEejdaK2tQK29CekkzZTk3ejdtZTAxTzRxWCthOGpybU9iL21mUU9hbFpSWXhPMjZzL1JLYWZhVjNRd0pDR2gKOEZwZEI4Y0tzbk96TExhZUpMckRCQjlHemhXUmRwdUtUNVQ5VS9ZOUtpaW5EQUxTeTBPZkdvOU9VY05LQ29uMAowWVp2Yk9uaHJaZHNIQU9nMW5GZkhGMGNrNVkvaHgySnJJeDJHQ084dXE0ak9DbkRja1RoM1RGNmRFQ2MvOHRoCm5EdDV1SGdVT1lRVm5CaTJ6bXk0SzN4TjNxam5NZmV1c0ZQbWxyY3Rhdz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
        }
				*/
});

//운동지수 나쁨 기준치
const C_RAIN = 1; //해당값 이상이면 나쁨
const C_SNOW = 1; //해당값 이상이면 나쁨
const C_WSPD = 14; //해당값 이상이면 나쁨
const C_UV = 6; //해당값 이상이면 나쁨
const C_SUMMER_PERIOD = [0416, 1015]; //기간 : 04/16 ~ 10/15
const C_SUMMER = 7; //해당값 이상 높으면 나쁨
const C_WINTER_PERIOD = [1016, 0415]; //기간 : 10/16 ~ 04/15
const C_WINTER = 7; //해당값 이상 낮으면 나쁨

//mysql module

//IBM Weather API 신임정보
const m_weather_cred = {
  username: '58a9b648-c932-4a01-aa3e-2b118d626d14',
  password: 'UiUQQWfZOg',
};

//날씨 API endpoint URL
var m_today = moment(new Date()).format('MMDD');
const m_weather_url = 'https://twcservice.mybluemix.net/api/weather/v1/geocode/37.565/126.939';
const m_weather_endpoint = {
  almanac_daily: '/almanac/daily.json?start=' + m_today,
  //almanac_daily: '/almanac/daily.json?start=0409',
  almanac_monthly:
    '/almanac/monthly.json?start=' +
    moment(new Date())
      .add(1, 'days')
      .format('MM'),
  forcast_en: '/forecast/daily/3day.json?language=en-US',
  forcast_kr: '/forecast/daily/3day.json?language=ko-KR',
  observation: '/observations.json?language=ko-KR',
  history: '/observations/timeseries.json?hours=15&language=ko-KR',
};

// 요청 세부 내용
const m_weather_input = {
  rejectUnauthorized: false,
  method: 'GET',
  url: m_weather_url,
  headers: {
    Authorization:
      'Basic ' + new Buffer.from(m_weather_cred.username + ':' + m_weather_cred.password).toString('base64'),
  },
};

//function putWeatherToDB() {
var putWeatherToDB = () =>
  new Promise((resolve, reject) => {
    var m_output = {};
    //20년 데이터 호출
    get_almanac()
      .then(m_result => {
        m_output.avg_hi = Number(m_result.avg_hi);
        m_output.avg_lo = Number(m_result.avg_lo);

        return get_forecast();
      })
      .then(m_result => {
        m_output.narration = m_result.narration;
        m_output.max_temp = m_result.max_temp;
        m_output.min_temp = m_result.min_temp;
        m_output.qpf = m_result.qpf;
        m_output.snow_qpf = m_result.snow_qpf;
        m_output.wspd = m_result.wspd;
        m_output.uv_index = m_result.uv_index;
        /*
         *	운동지수 계산
         */
        var activity_index = 'good';
        //온도확인
        if (m_today >= C_SUMMER_PERIOD[0] && m_today <= C_SUMMER_PERIOD[1]) {
          //여름이므로 최고 온도 차이 확인
          if (m_output.max_temp >= m_output.avg_hi + C_SUMMER) {
            activity_index = 'bad';
          }
        } else {
          //겨울이므로 최저 온도 차이 확인
          if (m_output.min_temp <= m_output.avg_lo - C_WINTER) {
            activity_index = 'bad';
          }
        }

        //비, 눈, 풍속, UV 확인
        if (m_output.qpf >= C_RAIN) activity_index = 'bad';
        if (m_output.snow_qpf >= C_SNOW) activity_index = 'bad';
        if (m_output.wspd >= C_WSPD) activity_index = 'bad';
        if (m_output.uv_index >= C_UV) activity_index = 'bad';

        //결과 저장
        m_output.activity_index = activity_index;
      })
      .then(results => {
        //DB에 적재
        var m_query =
          'INSERT INTO t_weather ' +
          ' (wth_t_created,wth_avg_hi,wth_avg_lo,wth_narration, ' +
          ' wth_max_temp,wth_min_temp,wth_qpf,wth_snow_qpf,wth_wspd, ' +
          ' wth_uv_index,wth_activity_index,wth_t_target) ' +
          ' VALUES (NOW(),?,?,?,?,?,?,?,?,?,?,?);';

        return dbquery(m_query, [
          m_output.avg_hi,
          m_output.avg_lo,
          m_output.narration,
          m_output.max_temp,
          m_output.min_temp,
          m_output.qpf,
          m_output.snow_qpf,
          m_output.wspd,
          m_output.uv_index,
          m_output.activity_index,
          moment(new Date())
            .add(1, 'days')
            .format('YYYY/MM/DD'),
        ]);
      })
      .catch(err => {
        return reject(err);
      });
  });

//20년간 통계
var get_almanac = () =>
  new Promise((resolve, reject) => {
    m_weather_input.url = m_weather_url + m_weather_endpoint.almanac_daily;
    request(m_weather_input, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var m_result = JSON.parse(body);
        if (m_result.almanac_summaries.length > 0) {
          //console.log(m_result);
          resolve(
            new Object({
              avg_hi: ((m_result.almanac_summaries[0].avg_hi - 32) / 1.8).toFixed(1),
              avg_lo: ((m_result.almanac_summaries[0].avg_lo - 32) / 1.8).toFixed(1),
            })
          );
        }
      } else {
        //console.log(err);
        reject(new Error(err));
      }
    });
  });

//내일 날씨 예측
var get_forecast = () =>
  new Promise((resolve, reject) => {
    m_weather_input.url = m_weather_url + m_weather_endpoint.forcast_kr;
    request(m_weather_input, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var m_result = JSON.parse(body);
        if (m_result.forecasts.length > 1) {
          //console.log(m_result.forecasts);

          //풍속 및 풍속주의보 여부 계산
          var wspd;
          var w_wind_alert = false;
          //낮 풍속 및 밤 풍속 중 큰 값을 저장
          if (!m_result.forecasts[1].day) {
            wspd = m_result.forecasts[1].night.wspd;
          } else if (!m_result.forecasts[1].night) {
            wspd = m_result.forecasts[1].day.wspd;
          } else if (m_result.forecasts[1].day.wspd > m_result.forecasts[1].night.wspd) {
            wspd = m_result.forecasts[1].day.wspd;
          } else {
            wspd = m_result.forecasts[1].night.wspd;
          }

          //풍속 및 풍속주의보 여부 계산
          var uv_index;
          //낮 자외선 및 밤 자외선 중 큰 값을 저장
          if (!m_result.forecasts[1].day) {
            uv_index = m_result.forecasts[1].night.uv_index;
          } else if (!m_result.forecasts[1].night) {
            uv_index = m_result.forecasts[1].day.uv_index;
          } else if (m_result.forecasts[1].day.uv_index > m_result.forecasts[1].night.uv_index) {
            uv_index = m_result.forecasts[1].day.uv_index;
          } else {
            uv_index = m_result.forecasts[1].night.uv_index;
          }

          resolve(
            new Object({
              narration: m_result.forecasts[1].narrative,
              max_temp: m_result.forecasts[1].max_temp,
              min_temp: m_result.forecasts[1].min_temp,
              qpf: m_result.forecasts[1].qpf,
              snow_qpf: m_result.forecasts[1].snow_qpf,
              wspd: wspd,
              uv_index: uv_index,
            })
          );
        }
      } else {
        console.log(err);
        reject(new Error(err));
      }
    });
  });

//현재 날씨
var get_current = () =>
  new Promise((resolve, reject) => {
    m_weather_input.url = m_weather_url + m_weather_endpoint.observation;

    request(m_weather_input, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var m_result = JSON.parse(body);
        //console.log(m_result.observation);

        resolve(
          new Object({
            narration: m_result.observation.wx_phrase,
          })
        );
      } else {
        console.log(err);
        reject(new Error(err));
      }
    });
  });

var get_history = () =>
  new Promise((resolve, reject) => {
    m_weather_input.url = m_weather_url + m_weather_endpoint.history;
    console.log(m_weather_input.url);
    request(m_weather_input, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var m_result = JSON.parse(body);
        console.log(m_result);
        resolve(
          new Object({
            data: m_result,
          })
        );
      } else {
        console.log(response);
        reject(new Error(err));
      }
    });
  });

var dbquery = (i_query, i_params) =>
  new Promise((resolve, reject) => {
    //db.connect();
    db.query(i_query, i_params, function(error, results) {
      console.log(results);
      if (error) {
        console.log('mysql database error : ' + error);
        reject(new Error('mysql database error : ' + error));
      }
      //db.end();
      resolve(results);
    });
  });

function cronWeather() {
  cron.schedule('50 23 * * *', function() {
    putWeatherToDB()
      .then(results => {
        console.log(results);
      })
      .catch(err => {
        console.log(err);
      });
  });
}

//cronWeather();

exports.dbquery = dbquery;
exports.putWeatherToDB = putWeatherToDB;
//exports.getWeather = getWeather;
exports.cronWeather = cronWeather;
