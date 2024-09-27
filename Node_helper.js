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
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        var airQualityData = {
          aqi: result.data.current.pollution.aqius,
        };
        self.sendSocketNotification("AIR_QUALITY_RESULT", airQualityData);
      } else {
        console.log("Error getting air quality data: " + error);
      }
    });
  },
});
