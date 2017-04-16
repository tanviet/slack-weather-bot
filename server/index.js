'use strict';

const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const async = require('async');
const Forecast = require('forecast');
const googleMaps = require('@google/maps');

// Init app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Init weather forecast
const forecast = new Forecast({
  service: 'darksky',
  key: config.DARK_SKY_API_KEY,
  units: 'celcius',
  cache: true,      // Cache API requests
  ttl: {
    minutes: 27,
    seconds: 45
  }
});

// Init Google Maps to getcode an address
const googleMapsClient = googleMaps.createClient({
  key: config.GOOGLE_MAPS_GEOCODING_API_KEY
});

// Start server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Server is listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* *******************************
/* Weather Forecast Slash Command
/* ***************************** */

app.get('/', (req, res) => {
  handleDataFromSlack(req.query, res);
});

app.post('/', (req, res) => {
  handleDataFromSlack(req.body, res);
});

/**
 * Outgoing Data
 *
 * When a matching chat message is received, a POST will be sent to the URL specified below. The data is defined as follows:
 *
 *  token=cIp7eBVRZ*************
    team_id=***8
    team_domain=example
    channel_id=C21****
    channel_name=test
    user_id=U21****
    user_name=Steve
    command=/weather
    text=94****
    response_url=https://hooks.slack.com/commands/1234/5678
 */

function handleDataFromSlack(data, res) {
  if (data.token !== config.SLACK_VERIFICATION_TOKEN) {
    // The request is NOT coming from Slack!
    return;
  }

  if (data.text) {
    var address = data.text.trim();

    async.waterfall([
      function(callback) {

        // Get geocoding info (lat, lng) for selected place
        googleMapsClient.geocode({
          address: address
        }, function(err, response) {
          if (!err) {
            callback(null, response.json.results[0].geometry.location.lat, response.json.results[0].geometry.location.lng);
          } else {
            callback(new Error('Failed getting address info.'));
          }
        });
      },
      function(lat, lng, callback) {
        forecast.get([lat, lng], function(err, weather) {
          if (!err) {
            callback(null, weather);
          } else {
            callback(new Error('Failed getting weather forecast info.'));
          }
        });
      }
    ], function (err, result) {
      if (err) {
        res.status(200).send(err);
        return;
      } else {

        // Send weather info to user on Slack client's interface
        let info = {
          response_type: 'in_channel', // 'in_channel' => public to the channel, 'ephemeral' => private message,
          text: result.currently.summary,
          ts: (new Date()).getTime(),
          attachments: [
            {
              fallback: 'Summary of the weather forecast for ' + address,
              color: '#36a64f',
              fields: [
                {
                  title: 'Timezone',
                  value: result.timezone,
                  short: true
                },
                {
                  title: 'Offset',
                  value: result.offset,
                  short: true
                },
                {
                  title: 'The intensity of precipitation',
                  value: result.currently.precipIntensity + ' (millimeters per hour)',
                  short: true
                },
                {
                  title: 'The probability of precipitation occurring',
                  value: (result.currently.precipProbability * 100).toFixed(2) + '%',
                  short: true
                },
                {
                  title: 'Temperature',
                  value: result.currently.temperature + ' (Degrees Celsius)',
                  short: true
                },
                {
                  title: 'The dew point',
                  value: result.currently.dewPoint + ' (Degrees Celsius)',
                  short: true
                },
                {
                  title: 'The relative humidity',
                  value: (result.currently.humidity * 100).toFixed(2) + '%',
                  short: true
                },
                {
                  title: 'The wind speed',
                  value: result.currently.windSpeed + ' (miles per hour)',
                  short: true
                },
                {
                  title: 'The average visibility in miles (capped at 10 miles)',
                  value: result.currently.visibility + ' (miles)',
                  short: true
                },
                {
                  title: 'The percentage of sky occluded by clouds',
                  value: (result.currently.cloudCover * 100).toFixed(2) + '%',
                  short: true
                },
                {
                  title: 'The sea-level air pressure',
                  value: result.currently.pressure + ' (millibars)',
                  short: true
                },
                {
                  title: 'The columnar density of total atmospheric ozone',
                  value: result.currently.ozone + ' (Dobson units)',
                  short: true
                }
              ]
            }
          ]
        };

        res.json(info);
      }
    });
  } else {
    res.send('Please enter place you want to view weather forecast.');
    return;
  }
}

/* *******************************
/* User register the app
/* ***************************** */

app.get('/slack', (req, res) => {
  if (!req.query.code) {  // access denied
    return;
  }

  var data = {
    form: {
      client_id: config.SLACK_APP_ID,
      client_secret: config.SLACK_APP_SECRET,
      code: req.query.code
    }
  };

  request.post('https://slack.com/api/oauth.access', data, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      let token = JSON.parse(body).access_token;

      request.post('https://slack.com/api/team.info', {form: {token: token}}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (JSON.parse(body).error === 'missing_scope') {
            res.status(200).send('The Weather Forecast has been added to your team.');
          } else {
            let team = JSON.parse(body).team.domain;
            res.redirect('https://' + team + '.slack.com');
          }
        }
      });
    }
  });
});
