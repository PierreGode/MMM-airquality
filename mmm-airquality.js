Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",
    latitude: "",
    longitude: "",
    updateInterval: 600000, // 10 minutes
    animationSpeed: 1000,
  },

  start: function () {
    this.airQualityData = null;
    this.updateData();
    this.scheduleUpdate();
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (!this.config.apiKey || !this.config.latitude || !this.config.longitude) {
      wrapper.innerHTML = "Please set the API key, latitude, and longitude in the config.js";
      return wrapper;
    }

    if (!this.airQualityData) {
      wrapper.innerHTML = "Loading air quality data...";
      return wrapper;
    }

    // Display the air quality data
    var airQualityIndex = document.createElement("div");
    airQualityIndex.innerHTML = "Air Quality Index: " + this.airQualityData.aqi;
    wrapper.appendChild(airQualityIndex);

    return wrapper;
  },

  updateData: function () {
    this.sendSocketNotification("GET_AIR_QUALITY", {
      apiKey: this.config.apiKey,
      latitude: this.config.latitude,
      longitude: this.config.longitude,
    });
  },

  scheduleUpdate: function () {
    var self = this;
    setInterval(function () {
      self.updateData();
    }, this.config.updateInterval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "AIR_QUALITY_RESULT") {
      this.airQualityData = payload;
      this.updateDom(this.config.animationSpeed);
    }
  },
});
