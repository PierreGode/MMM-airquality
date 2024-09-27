var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-airquality helper started...");
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
        console.error("Error requesting air quality data: ", error);
        return;
      }
      if (response.statusCode !== 200) {
        console.error("Received non-200 response from air quality API: ", response.statusCode);
        return;
      }

      var result;
      try {
        result = JSON.parse(body);
      } catch (e) {
        console.error("Error parsing air quality API response: ", e);
        return;
      }

      if (!result || !result.data || !result.data.current || !result.data.current.pollution) {
        console.error("Invalid air quality data received from API.");
        return;
      }

      // Parse relevant data from API response
      var airQualityData = {
        city: result.data.city,
        aqiUS: result.data.current.pollution.aqius,
        mainUS: result.data.current.pollution.mainus,
        temperature: result.data.current.weather.tp,
        humidity: result.data.current.weather.hu,
      };

      self.sendSocketNotification("AIR_QUALITY_RESULT", airQualityData);
    });
  },
});
