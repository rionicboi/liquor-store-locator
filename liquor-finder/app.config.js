const appConfig = require('./app.json');

module.exports = {
  ...appConfig.expo,
  extra: {
    ...appConfig.expo.extra,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
};
