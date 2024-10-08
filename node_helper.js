const Log = require("logger");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start() {
    Log.log("[MMM-airquality] Node Helper started");
  },

  socketNotificationReceived(notification, payload) {
    Log.log(`[MMM-airquality] Received socket notification: ${notification}`);
    if (notification === "GET_DATA") {
      Log.log("[MMM-airquality] Fetching data for pollen, air quality, and pollen forecast...");
      this.getData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  async getData(apiKey, latitude, longitude) {
    const self = this;

    const pollenUrl = `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${latitude}&lng=${longitude}`;
    const airQualityUrl = `https://api.ambeedata.com/latest/by-lat-lng?lat=${latitude}&lng=${longitude}`;
    const pollenForecastUrl = `https://api.ambeedata.com/forecast/pollen/by-lat-lng?lat=${latitude}&lng=${longitude}`;

    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json"
    };

    try {
      const response = await fetch(pollenUrl, { headers });
      if (!response.ok) {
        throw new Error(`[MMM-airquality] Error fetching pollen data: ${response.status}`);
      }
      const data = await response.json();
      self.sendSocketNotification("POLLEN_RESULT", { data });
      Log.log("[MMM-airquality] Pollen data fetched");
    } catch (error) {
      Log.error("[MMM-airquality] Error fetching pollen data: " + error);
    }

    try {
      const response = await fetch(airQualityUrl, { headers });
      if (!response.ok) {
        throw new Error(`[MMM-airquality] Error fetching air quality data: ${response.status}`);
      }
      const data = await response.json();
      const airQualityResult = data.stations[0];
      self.sendSocketNotification("AIR_QUALITY_RESULT", { data: airQualityResult });
      Log.log("[MMM-airquality] Air quality data fetched");
    } catch (error) {
      Log.error("[MMM-airquality] Error fetching air quality data: " + error);
    }

    try {
      const response = await fetch(pollenForecastUrl, { headers });
      if (!response.ok) {
        throw new Error(`[MMM-airquality] Error fetching pollen forecast data: ${response.status}`);
      }
      const data = await response.json();
      const pollenForecastResult = data.data;
      self.sendSocketNotification("POLLEN_FORECAST_RESULT", { data: pollenForecastResult });
      Log.log("[MMM-airquality] Pollen forecast data fetched");
    } catch (error) {
      Log.error("[MMM-airquality] Error fetching pollen forecast data: " + error);
    }
  }
});
