var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-airquality] Node Helper started");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_AIR_QUALITY") {
      this.getAirQualityData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  getAirQualityData: function (apiKey, latitude, longitude) {
    var self = this;
    var url = `https://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${apiKey}`;

    request(url, function (error, response, body) {
      if (error) {
        console.error("[MMM-airquality] Error requesting air quality data:", error);
        return;
      }
      if (response.statusCode !== 200) {
        console.error("[MMM-airquality] Non-200 response from API:", response.statusCode);
        return;
      }

      var result;
      try {
        result = JSON.parse(body);
        if (result.status !== "success") {
          console.error("[MMM-airquality] API error:", result.data.message);
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
          // Weather data
          temperature: weather.tp,
          pressure: weather.pr,
          humidity: weather.hu,
          windSpeed: weather.ws,
          windDirection: weather.wd
        };

        self.sendSocketNotification("AIR_QUALITY_RESULT", { data: airQualityData });
      } catch (e) {
        console.error("[MMM-airquality] Error parsing API response:", e);
      }
    });
  }
});
