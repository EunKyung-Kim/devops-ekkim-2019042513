/*
	소스
*/
var request = require('request');
var moment = require('moment');

moment.locale('ko', {
  weekdays: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  weekdaysShort: ['일', '월', '화', '수', '목', '금', '토'],
});

var mysql = require('mysql');
var cron = require('node-cron');

const db = mysql.createPool({
  host: 'cap-sg-prd-4.securegateway.appdomain.cloud',
  port: 19440,
  database: 'kyobo',
  charset: 'utf8',
  user: 'root',
  password: 'passw0rd',
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
          ' VALUES (NOW(),?,?,?,?,?,?,?,?,?,?,subdate(curdate(),-1));';

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
          //moment().add(1,'days').format('YYYY/MM/DD')
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
    console.log(`dbquery ${i_query} ${i_params}`);
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
  putWeatherToDB()
    .then(results => {
      console.log(results);
    })
    .catch(err => {
      console.log(err);
    });
  setInterval(function() {
    putWeatherToDB()
      .then(results => {
        console.log(results);
      })
      .catch(err => {
        console.log(err);
      });
  }, 1000 * 60 * 60);
  //1000*60*60 = 1시간마다 업데이트

  /*
	cron.schedule('* * * * *', function(){
		putWeatherToDB()
		.then(results => {
			console.log(results);
		})
		.catch(err => {
			console.log(err);
		});
	});
	*/
}

console.log(
  moment()
    .add(1, 'days')
    .format('YYYY/MM/DD HH:mm:ss')
);
//subdate(curdate(),1);

exports.dbquery = dbquery;
exports.putWeatherToDB = putWeatherToDB;
//exports.getWeather = getWeather;
exports.cronWeather = cronWeather;
