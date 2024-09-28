Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",           // Ambee API Key
    latitude: "",         // Latitude of your location
    longitude: "",        // Longitude of your location
    updateInterval: 900000, // Update every 15 minutes (max 96 calls/day)
    animationSpeed: 1000, // Animation speed in milliseconds
    debug: false,
  },

  start() {
    Log.info(`[MMM-airquality] Starting module: ${this.name}`);
    this.loaded = false;
    this.weatherData = null;
    this.pollenData = null;
    this.airQualityData = null;
    this.scheduleUpdate();
    this.updateTimer = null;

    if (this.config.debug) {
      Log.info("[MMM-airquality] Debug mode ON");
    }
    Log.info("[MMM-airquality] Initializing data fetch...");
    this.updateData(this);
  },

  updateData(self) {
    Log.info("[MMM-airquality] Sending socket notification to fetch data...");
    self.sendSocketNotification("GET_DATA", {
      apiKey: self.config.apiKey,
      latitude: self.config.latitude,
      longitude: self.config.longitude
    });
  },

  getStyles() {
    return ["MMM-airquality.css"];
  },

  getDom() {
    Log.info("[MMM-airquality] Rendering DOM...");
    const wrapper = document.createElement("div");
    wrapper.className = "airquality-wrapper";

    if (!this.loaded) {
      wrapper.innerHTML = "Loading data...";
      wrapper.className = "dimmed light small";
      Log.info("[MMM-airquality] Data not loaded yet, showing loading message");
      return wrapper;
    }

    if (!this.weatherData || !this.pollenData || !this.airQualityData) {
      wrapper.innerHTML = "No data available.";
      wrapper.className = "dimmed light small";
      Log.error("[MMM-airquality] No data available");
      return wrapper;
    }

    // Weather and Air Quality Section
    const weatherAQIWrapper = document.createElement("div");
    weatherAQIWrapper.className = "weather-aqi-wrapper";

    const location = document.createElement("div");
    location.className = "location";
    location.innerHTML = this.weatherData.city;
    weatherAQIWrapper.appendChild(location);

    const weatherAQI = document.createElement("div");
    weatherAQI.className = "weather-aqi";
    weatherAQI.innerHTML = `Weather Today | AQI ${this.airQualityData.AQI} (${this.airQualityData.aqiInfo.category})`;
    weatherAQIWrapper.appendChild(weatherAQI);

    wrapper.appendChild(weatherAQIWrapper);
    Log.info("[MMM-airquality] Displaying weather and AQI data");

    // Pollen Data Section
    const pollenWrapper = document.createElement("div");
    pollenWrapper.className = "pollen-wrapper";

    const pollenTitle = document.createElement("div");
    pollenTitle.className = "pollen-title";
    pollenTitle.innerHTML = "Pollen Count & Risk";
    pollenWrapper.appendChild(pollenTitle);

    const pollenSummary = document.createElement("div");
    pollenSummary.className = "pollen-summary";
    pollenSummary.innerHTML = `Weed Pollen Count: ${this.pollenData.weed_pollen} (${this.pollenData.Risk.weed_pollen})`;
    pollenWrapper.appendChild(pollenSummary);

    const weedDetails = document.createElement("div");
    weedDetails.className = "pollen-details";
    weedDetails.innerHTML = `Chenopod: ${this.pollenData.Species.Weed.Chenopod}, Mugwort: ${this.pollenData.Species.Weed.Mugwort}, Nettle: ${this.pollenData.Species.Weed.Nettle}, Ragweed: ${this.pollenData.Species.Weed.Ragweed}`;
    pollenWrapper.appendChild(weedDetails);

    wrapper.appendChild(pollenWrapper);
    Log.info("[MMM-airquality] Displaying pollen data");

    return wrapper;
  },

  processWeather(data) {
    Log.info("[MMM-airquality] Weather data received");
    this.weatherData = data;
    this.checkIfDataLoaded();
  },

  processAirQuality(data) {
    Log.info("[MMM-airquality] Air quality data received");
    this.airQualityData = data;
    this.checkIfDataLoaded();
  },

  processPollen(data) {
    Log.info("[MMM-airquality] Pollen data received");
    this.pollenData = data;
    this.checkIfDataLoaded();
  },

  checkIfDataLoaded() {
    if (this.weatherData && this.airQualityData && this.pollenData) {
      Log.info("[MMM-airquality] All data loaded, updating DOM");
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    } else {
      Log.info("[MMM-airquality] Data still loading...");
    }
  },

  scheduleUpdate(delay = null) {
    const nextLoad = delay !== null ? delay : this.config.updateInterval;

    const self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      Log.info("[MMM-airquality] Scheduling next data fetch");
      self.updateData(self);
    }, nextLoad);
  },

  socketNotificationReceived(notification, payload) {
    Log.info(`[MMM-airquality] Socket notification received: ${notification}`);
    if (notification === "WEATHER_RESULT") {
      this.processWeather(payload.data);
    } else if (notification === "AIR_QUALITY_RESULT") {
      this.processAirQuality(payload.data);
    } else if (notification === "POLLEN_RESULT") {
      this.processPollen(payload.data);
    }
  }
});
