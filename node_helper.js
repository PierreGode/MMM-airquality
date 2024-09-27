var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-airquality] Node Helper started"); // Log when node helper starts
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("[MMM-airquality] Received socket notification:", notification, payload); // Log when receiving socket notifications
    if (notification === "GET_AIR_QUALITY") {
      this.getAirQualityData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  getAirQualityData: function (apiKey, latitude, longitude) {
    var self = this;
    var url = `https://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${apiKey}`;

    console.log("[MMM-airquality] Fetching data from API:", url); // Log API call

    request(url, function (error, response, body) {
      if (error) {
        console.error("[MMM-airquality] Error requesting air quality data:", error); // Log request error
        return;
      }
      if (response.statusCode !== 200) {
        console.error("[MMM-airquality] Non-200 response from API:", response.statusCode); // Log non-200 response
        return;
      }

      var result;
      try {
        result = JSON.parse(body);
        console.log("[MMM-airquality] Data received from API:", result); // Log data from API
      } catch (e) {
        console.error("[MMM-airquality] Error parsing API response:", e); // Log parsing errors
        return;
      }

      if (!result || !result.data || !result.data.current || !result.data.current.pollution) {
        console.error("[MMM-airquality] Invalid data received from API"); // Log if API data is invalid
        return;
      }

      var airQualityData = {
        city: result.data.city,
        aqiUS: result.data.current.pollution.aqius,
        mainUS: result.data.current.pollution.mainus,
        temperature: result.data.current.weather.tp,
        humidity: result.data.current.weather.hu,
      };

      console.log("[MMM-airquality] Sending air quality data back to module:", airQualityData); // Log sending data back
      self.sendSocketNotification("AIR_QUALITY_RESULT", airQualityData);
    });
  },
});
