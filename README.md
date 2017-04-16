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

### 7. Setting up Your App

To share your custom integration, you need to deploy the code and make it installable. To do so, you need to work on a few more things.

Now you need to register for your app and get your API keys. First, go to [https://api.slack.com/apps](https://api.slack.com/apps), and click the **Create an App** button. You can fill out the rest of the form later. The App config may be a bit confusing because there are multiple parts (and you may not even notice everything first). For a slash command bot, you need to fill out at least these sections:

- Basic Information (at https://api.slack.com/apps/YOUR_APP_ID/general)
- OAuth & Permissions (at https://api.slack.com/apps/YOUR_APP_ID/oauth)
- Slash Commands (at https://api.slack.com/apps/YOUR_APP_ID/slash-commands)

#### 7a. Authenticating a User

Basically, what you are going to do are:

1. Set up a web page with the button that passes some params to Slack. (User: After clicking the button, Slack redirects the user to authenticate).
2. Your node app will receive a temporary `code` from Slack via `GET`. The temp code expires in 10 min.
3. Exchange the authorization code for an access token using the `oauth.access` API by `POST` method. The auth process is done when your node app receives 200 OK.
4. Optionally, use the `token` to call another API to get the team name, so that you can redirect the user to the team URL, https://team-name.slack.com right after the auth is done.

#### 7b. Setting up Your Button

Go to [https://api.slack.com/docs/slack-button](https://api.slack.com/docs/slack-button), scroll to **Add the Slack button** to generate your button. Make sure to check **Commands** for the scope.

If you want to do the optional API call to get the team info (step 4), you need to tweak the GET param in the auth URL like this

```html
<a href="https://slack.com/oauth/authorize?scope=commands+team%3Aread&client_id=your_client_id">
```

Notice the scope-along with `commands`, add `team:read` (Escape the `:` as `%3A`). You can learn more about [OAuth scopes on the Slack API docs](https://api.slack.com/docs/oauth-scopes).

#### 7c. Issuing Token

Let’s use Express.js again to GET the temporary code (`req.query.code`) from Slack.

I am using `/slack` route. You can name whatever you want but make sure that you use the URL (Use your ngrok URL such as *http://a057cf22.ngrok.io/slack* during development) as a *Redirect URL* at **OAuth & Permissions** at *https://api.slack.com/apps/YOUR_APP_ID/oauth* as a part of your App configuration.

Once you get the temp code, you need to POST the code along with your credentials to exchange the code for an access token. To POST, I am using [request](https://www.npmjs.com/package/request), a HTTP request client for Node.js.

#### 7d. Deploying to Server

You can deploy wherever you want. But if you want to deploy to Heroku, I found [this article by Heroku](https://blog.heroku.com/how-to-deploy-your-slack-bots-to-heroku) helpful.

Currently I am using configuration file in `/server/config.js` but if you want to set up them as environment variables, you can try with `heroku config` command such as `heroku config:set API_KEY=123` and remember to change `config.<key>` to `process.env.<key>` in **server/index.js**.

Once you are done with the deployment, go back to your Slack App setting page to change the `OAuth & Permission` and `Slash Commands` URL from your ngrok URL to the Heroku URL.