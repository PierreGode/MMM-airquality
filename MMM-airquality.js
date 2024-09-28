Module.register("MMM-airquality", {
  defaults: {
    airQualityApiKey: "", // IQAir API Key
    pollenApiKey: "",     // Ambee API Key
    latitude: "",
    longitude: "",
    updateInterval: 600000, // 10 minutes
    animationSpeed: 1000,
    debug: false, // Set to true to log debug information
  },

  start: function () {
    console.log("[MMM-airquality] Module started");
    this.airQualityData = null;
    this.pollenData = null;
    this.loaded = false; // To show loading message
    this.updateData();
    this.scheduleUpdate();
  },

  getDom: function () {
    console.log("[MMM-airquality] Rendering DOM");
    var wrapper = document.createElement("div");

    if (!this.loaded) {
      console.log("[MMM-airquality] Data not loaded yet, showing loading message");
      wrapper.innerHTML = "Loading air quality and pollen data...";
      return wrapper;
    }

    if (!this.airQualityData || !this.pollenData) {
      console.log("[MMM-airquality] No air quality or pollen data available");
      wrapper.innerHTML = "No air quality or pollen data available.";
      return wrapper;
    }

    // Display Air Quality Data
    console.log("[MMM-airquality] Displaying air quality data:", this.airQualityData);
    var airQualityIndex = document.createElement("div");
    airQualityIndex.innerHTML = `City: ${this.airQualityData.city}, AQI (US): ${this.airQualityData.aqiUS}, Main Pollutant: ${this.airQualityData.mainUS}`;
    wrapper.appendChild(airQualityIndex);

    var weatherData = document.createElement("div");
    weatherData.innerHTML = `Temperature: ${this.airQualityData.temperature}°C, Humidity: ${this.airQualityData.humidity}%`;
    wrapper.appendChild(weatherData);

    // Display Pollen Data
    console.log("[MMM-airquality] Displaying pollen data:", this.pollenData);
    var pollenData = document.createElement("div");
    pollenData.innerHTML = `
      <strong>Pollen Levels:</strong> 
      Grass: ${this.pollenData.grass}, 
      Tree: ${this.pollenData.tree}, 
      Weed: ${this.pollenData.weed}`;
    wrapper.appendChild(pollenData);

    return wrapper;
  },

  updateData: function () {
    console.log("[MMM-airquality] Updating data...");
    if (!this.config.airQualityApiKey || !this.config.pollenApiKey || !this.config.latitude || !this.config.longitude) {
      console.error("[MMM-airquality] API Key, Latitude, or Longitude not set in config.js");
      return;
    }

    if (this.config.debug) {
      console.log("[MMM-airquality] Fetching air quality and pollen data with debug mode ON");
    }

    console.log(`[MMM-airquality] Fetching data for lat: ${this.config.latitude}, lon: ${this.config.longitude}`);
    
    // Fetch Air Quality Data
    this.sendSocketNotification("GET_AIR_QUALITY", {
      apiKey: this.config.airQualityApiKey,
      latitude: this.config.latitude,
      longitude: this.config.longitude,
    });

    // Fetch Pollen Data
    this.sendSocketNotification("GET_POLLEN_DATA", {
      apiKey: this.config.pollenApiKey,
      latitude: this.config.latitude,
      longitude: this.config.longitude,
    });
  },

  scheduleUpdate: function () {
    console.log("[MMM-airquality] Scheduling next update");
    var self = this;
    setTimeout(function () {
      self.updateData();
      self.scheduleUpdate(); // Schedule the next update
    }, this.config.updateInterval);
  },

  socketNotificationReceived: function (notification, payload) {
    console.log(`[MMM-airquality] Socket notification received: ${notification}`);
    
    if (notification === "AIR_QUALITY_RESULT") {
      if (this.config.debug) {
        console.log("[MMM-airquality] Air quality data received:", payload);
      }
      this.airQualityData = payload;
    }

    if (notification === "POLLEN_RESULT") {
      if (this.config.debug) {
        console.log("[MMM-airquality] Pollen data received:", payload);
      }
      this.pollenData = payload;
    }

    if (this.airQualityData && this.pollenData) {
      this.loaded = true;
      console.log("[MMM-airquality] Data loaded, updating DOM");
      this.updateDom(this.config.animationSpeed);
    }
  },
});
