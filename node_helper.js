var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-airquality] Node Helper started");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_AIR_QUALITY") {
      this.getAirQualityData(payload.apiKey, payload.latitude, payload.longitude);
    } else if (notification === "GET_POLLEN_DATA") {
      this.getPollenData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  // Fetch air quality data from IQAir API
  getAirQualityData: function (apiKey, latitude, longitude) {
    var self = this;
    var url = `https://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${apiKey}`;

    request(url, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error(`[MMM-airquality] Air quality API request failed: ${error || response.statusCode}`);
        self.sendSocketNotification("AIR_QUALITY_RESULT", { data: null }); // Send null to indicate failure
        return;
      }

      try {
        var result = JSON.parse(body);
        if (result.status !== "success") {
          console.error("[MMM-airquality] Air quality API error:", result.data.message);
          self.sendSocketNotification("AIR_QUALITY_RESULT", { data: null });
          return;
        }

        const pollution = result.data.current.pollution;
        const weather = result.data.current.weather;

        var airQualityData = {
          city: result.data.city,
          aqiUS: pollution.aqius,
          co: pollution.co || "-",
          no2: pollution.no2 || "-",
          o3: pollution.o3 || "-",
          pm10: pollution.pm10 || "-",
          pm25: pollution.pm25 || "-",
          so2: pollution.so2 || "-",
          temperature: weather.tp,
          pressure: weather.pr,
          humidity: weather.hu,
          windSpeed: weather.ws,
          windDirection: weather.wd
        };

        console.log("[MMM-airquality] Air quality data successfully fetched and processed");
        self.sendSocketNotification("AIR_QUALITY_RESULT", { data: airQualityData });
      } catch (e) {
        console.error("[MMM-airquality] Error parsing air quality API response:", e);
        self.sendSocketNotification("AIR_QUALITY_RESULT", { data: null });
      }
    });
  },

  // Fetch pollen data from Ambee API
  getPollenData: function (apiKey, latitude, longitude) {
    var self = this;
    var url = `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${latitude}&lng=${longitude}`;

    var options = {
      url: url,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      }
    };

    request(options, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error(`[MMM-airquality] Pollen API request failed: ${error || response.statusCode}`);
        self.sendSocketNotification("POLLEN_RESULT", { data: null }); // Send null to indicate failure
        return;
      }

      try {
        var result = JSON.parse(body);
        const pollenData = result.data;

        var pollenInfo = {
          grass: pollenData.grass_pollen || "-",
          tree: pollenData.tree_pollen || "-",
          weed: pollenData.weed_pollen || "-"
        };

        console.log("[MMM-airquality] Pollen data successfully fetched and processed");
        self.sendSocketNotification("POLLEN_RESULT", { data: pollenInfo });
      } catch (e) {
        console.error("[MMM-airquality] Error parsing pollen API response:", e);
        self.sendSocketNotification("POLLEN_RESULT", { data: null });
      }
    });
  }
});
