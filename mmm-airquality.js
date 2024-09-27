Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",
    latitude: "",
    longitude: "",
    updateInterval: 600000, // 10 minutes
    animationSpeed: 1000,
    debug: false, // Set to true to log debug information
  },

  start: function () {
    this.airQualityData = null;
    this.loaded = false; // To show loading message
    this.updateData();
    this.scheduleUpdate();
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading air quality data...";
      return wrapper;
    }

    if (!this.airQualityData) {
      wrapper.innerHTML = "No air quality data available.";
      return wrapper;
    }

    // Display the air quality index (AQI) and weather
    var airQualityIndex = document.createElement("div");
    airQualityIndex.innerHTML = `City: ${this.airQualityData.city}, AQI (US): ${this.airQualityData.aqiUS}, Main Pollutant: ${this.airQualityData.mainUS}`;
    wrapper.appendChild(airQualityIndex);

    var weatherData = document.createElement("div");
    weatherData.innerHTML = `Temperature: ${this.airQualityData.temperature}°C, Humidity: ${this.airQualityData.humidity}%`;
    wrapper.appendChild(weatherData);

    return wrapper;
  },

  updateData: function () {
    if (!this.config.apiKey || !this.config.latitude || !this.config.longitude) {
      console.error("MMM-airquality: API Key, Latitude, or Longitude not set in config.js");
      return;
    }
    if (this.config.debug) {
      console.log("Fetching air quality data...");
    }

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
      if (this.config.debug) {
        console.log("Air quality data received:", payload);
      }
      this.airQualityData = payload;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  },
});
