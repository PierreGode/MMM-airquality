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
    console.log("[MMM-airquality] Module started"); // Log the module start
    this.airQualityData = null;
    this.loaded = false; // To show loading message
    this.updateData();
    this.scheduleUpdate();
  },

  getDom: function () {
    console.log("[MMM-airquality] Rendering DOM"); // Log DOM rendering
    var wrapper = document.createElement("div");

    if (!this.loaded) {
      console.log("[MMM-airquality] Data not loaded yet, showing loading message"); // Log when data hasn't loaded yet
      wrapper.innerHTML = "Loading air quality data...";
      return wrapper;
    }

    if (!this.airQualityData) {
      console.log("[MMM-airquality] No air quality data available"); // Log when no data is available
      wrapper.innerHTML = "No air quality data available.";
      return wrapper;
    }

    console.log("[MMM-airquality] Displaying air quality data:", this.airQualityData); // Log air quality data display
    var airQualityIndex = document.createElement("div");
    airQualityIndex.innerHTML = `City: ${this.airQualityData.city}, AQI (US): ${this.airQualityData.aqiUS}, Main Pollutant: ${this.airQualityData.mainUS}`;
    wrapper.appendChild(airQualityIndex);

    var weatherData = document.createElement("div");
    weatherData.innerHTML = `Temperature: ${this.airQualityData.temperature}°C, Humidity: ${this.airQualityData.humidity}%`;
    wrapper.appendChild(weatherData);

    return wrapper;
  },

  updateData: function () {
    console.log("[MMM-airquality] Updating data..."); // Log data update
    if (!this.config.apiKey || !this.config.latitude || !this.config.longitude) {
      console.error("[MMM-airquality] API Key, Latitude, or Longitude not set in config.js"); // Log when config is missing
      return;
    }
    if (this.config.debug) {
      console.log("[MMM-airquality] Fetching air quality data with debug mode ON");
    }

    console.log(`[MMM-airquality] Fetching data for lat: ${this.config.latitude}, lon: ${this.config.longitude}`); // Log the API request
    this.sendSocketNotification("GET_AIR_QUALITY", {
      apiKey: this.config.apiKey,
      latitude: this.config.latitude,
      longitude: this.config.longitude,
    });
  },

  scheduleUpdate: function () {
    console.log("[MMM-airquality] Scheduling next update"); // Log scheduling updates
    var self = this;
    setInterval(function () {
      self.updateData();
    }, this.config.updateInterval);
  },

  socketNotificationReceived: function (notification, payload) {
    console.log(`[MMM-airquality] Socket notification received: ${notification}`); // Log notifications
    if (notification === "AIR_QUALITY_RESULT") {
      if (this.config.debug) {
        console.log("[MMM-airquality] Air quality data received:", payload); // Log the received data
      }
      this.airQualityData = payload;
      this.loaded = true;
      console.log("[MMM-airquality] Data loaded, updating DOM"); // Log when data is loaded
      this.updateDom(this.config.animationSpeed);
    }
  },
});
