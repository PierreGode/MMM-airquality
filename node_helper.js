const NodeHelper = require("node_helper");
const request = require("request");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-airquality] Node Helper started");
  },

  socketNotificationReceived: function (notification, payload) {
    console.log(`[MMM-airquality] Received socket notification: ${notification}`);
    if (notification === "GET_DATA") {
      console.log("[MMM-airquality] Fetching data for pollen, air quality, and pollen forecast...");
      this.getData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  getData: function (apiKey, latitude, longitude) {
    const self = this;

    const pollenUrl = `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${latitude}&lng=${longitude}`;
    const airQualityUrl = `https://api.ambeedata.com/latest/by-lat-lng?lat=${latitude}&lng=${longitude}`;
    const pollenForecastUrl = `https://api.ambeedata.com/forecast/pollen/by-lat-lng?lat=${latitude}&lng=${longitude}`;

    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json"
    };

    // Fetch Pollen Data
    request({ url: pollenUrl, headers: headers }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error("[MMM-airquality] Error fetching pollen data:", error || response.statusCode);
      } else {
        const pollenResult = JSON.parse(body);
        self.sendSocketNotification("POLLEN_RESULT", { data: pollenResult });
        console.log("[MMM-airquality] Pollen data fetched");
      }
    });

    // Fetch Air Quality Data
    request({ url: airQualityUrl, headers: headers }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error("[MMM-airquality] Error fetching air quality data:", error || response.statusCode);
      } else {
        const airQualityResult = JSON.parse(body).stations[0];
        self.sendSocketNotification("AIR_QUALITY_RESULT", { data: airQualityResult });
        console.log("[MMM-airquality] Air quality data fetched");
      }
    });

    // Fetch Pollen Forecast Data
    request({ url: pollenForecastUrl, headers: headers }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error("[MMM-airquality] Error fetching pollen forecast data:", error || response.statusCode);
      } else {
        const pollenForecastResult = JSON.parse(body).data;
        self.sendSocketNotification("POLLEN_FORECAST_RESULT", { data: pollenForecastResult });
        console.log("[MMM-airquality] Pollen forecast data fetched");
      }
    });
  }
});
