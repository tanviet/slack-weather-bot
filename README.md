# Slack Weather Bot

A Slack bot is used to show weather forecast for selected places.

![Slack Weather Bot](https://github.com/tanviet/slack-weather-bot/blob/master/public/images/new-york-weather.png)

### 1. Install dependencies

```bash
$ npm install
```

### 2. Creating Your Private Slash Command

Sign in to your Slack account and choose your command at `<my-team>.slack.com/services/new/slash-commands`. In my case, I entered `/weather` and hit the **Add Slash Command Integration** button to go to the next page. Go ahead and fill out some of the important fields.

- Command: `<your-slack-command>` (it will be `/weather` in this case).
- URL: `<your-bot-server>` (I used ngrok to develop on local environment).
- Method: `<select-method-that-Slack-sends-data-to-your-server>`.

For local development purpose, you should install [ngrok](https://ngrok.com). Once installed, run on terminal:

```bash
$ ngrok http 3000
```

Get the http link that ngrok generated and fill out it to above URL field.

### 3. Register Google Maps Geocoding key

Follow [this page](https://developers.google.com/maps/documentation/geocoding/get-api-key) to get a API key so that our app can get place's information such as lat, lng...and use them into Forecast API.

### 4. Register Dark Sky key

Sign up a [new account](https://darksky.net/dev/) and get API key to get weather forecast data.

### 5. Setup your credentials on config.js

Create `config.js` file in `server` folder and you should include your credentials into that file.

```javascript
module.exports = {
  SLACK_VERIFICATION_TOKEN: '<your-token>',
  DARK_SKY_API_KEY: '<your-key>',
  GOOGLE_MAPS_GEOCODING_API_KEY: '<your-key>'
}
```

### 6. Run the app

```bash
$ node server/index.js
```

And then on Slack's client interface, you can enter `/weather NewYork` to test your command.
