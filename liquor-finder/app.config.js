const appConfig = require('./app.json');

module.exports = {
  ...appConfig.expo,
  extra: {
    ...appConfig.expo.extra,

    eas: {
      projectId: "6f2e9e04-8074-48e8-b4b2-3cf8e6746afb",
    },

    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
};