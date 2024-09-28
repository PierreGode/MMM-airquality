Module.register("MMM-airquality", {
  defaults: {
    airQualityApiKey: "", // IQAir API Key
    pollenApiKey: "",     // Ambee API Key
    latitude: "",
    longitude: "",
    updateInterval: 30 * 60 * 1000, // Update every 30 minutes
    animationSpeed: 1000, // Animation speed in milliseconds
    pollutants: ["o3", "pm10", "pm25", "no2", "co", "so2"], // Pollutants to display
    pollenTypes: ["grass", "tree", "weed"], // Pollen types to display
    debug: false,
  },

  start() {
    Log.info(`Starting module: ${this.name}`);
    this.loaded = false;
    this.airQualityData = null;
    this.pollenData = null;
    this.scheduleUpdate();
    this.updateTimer = null;
    this.updateAirQuality(this);
    this.updatePollenData(this);
  },

  updateAirQuality(self) {
    self.sendSocketNotification("GET_AIR_QUALITY", {
      apiKey: self.config.airQualityApiKey,
      latitude: self.config.latitude,
      longitude: self.config.longitude
    });
  },

  updatePollenData(self) {
    self.sendSocketNotification("GET_POLLEN_DATA", {
      apiKey: self.config.pollenApiKey,
      latitude: self.config.latitude,
      longitude: self.config.longitude
    });
  },

  getStyles() {
    return ["MMM-airquality.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "airquality-wrapper";  // Adding a wrapper class for styling

    if (!this.loaded) {
      wrapper.innerHTML = "Loading data...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.airQualityData && !this.pollenData) {
      wrapper.innerHTML = "No data available.";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    // Air Quality Data Display
    if (this.airQualityData) {
      const aqiWrapper = document.createElement("div");
      aqiWrapper.className = "aqi-wrapper";

      const aqiTitle = document.createElement("div");
      aqiTitle.className = "aqi-title";
      aqiTitle.innerHTML = "Air Quality Index (AQI)";
      aqiWrapper.appendChild(aqiTitle);

      const aqiData = document.createElement("div");
      aqiData.className = "aqi-data";
      aqiData.innerHTML = `${this.airQualityData.city}: AQI ${this.airQualityData.aqiUS}`;
      aqiWrapper.appendChild(aqiData);

      const weatherData = document.createElement("div");
      weatherData.className = "weather-data";
      weatherData.innerHTML = `Temp: ${this.airQualityData.temperature}°C, Humidity: ${this.airQualityData.humidity}%`;
      aqiWrapper.appendChild(weatherData);

      wrapper.appendChild(aqiWrapper);
    }

    // Pollen Data Display
    if (this.pollenData) {
      const pollenWrapper = document.createElement("div");
      pollenWrapper.className = "pollen-wrapper";

      const pollenTitle = document.createElement("div");
      pollenTitle.className = "pollen-title";
      pollenTitle.innerHTML = "Pollen Levels";
      pollenWrapper.appendChild(pollenTitle);

      this.config.pollenTypes.forEach((pollenType) => {
        const pollenRow = document.createElement("div");
        pollenRow.className = "pollen-row";

        let label = "";
        let value = "";
        switch (pollenType) {
          case "grass":
            label = "Grass";
            value = this.pollenData.grass;
            break;
          case "tree":
            label = "Tree";
            value = this.pollenData.tree;
            break;
          case "weed":
            label = "Weed";
            value = this.pollenData.weed;
            break;
        }

        const pollenLabel = document.createElement("span");
        pollenLabel.className = "pollen-label";
        pollenLabel.innerHTML = `${label}: `;

        const pollenValue = document.createElement("span");
        pollenValue.className = "pollen-value";
        pollenValue.innerHTML = value;

        pollenRow.appendChild(pollenLabel);
        pollenRow.appendChild(pollenValue);

        pollenWrapper.appendChild(pollenRow);
      });

      wrapper.appendChild(pollenWrapper);
    }

    return wrapper;
  },

  processAirQuality(result) {
    this.airQualityData = result;
    this.checkIfDataLoaded();
  },

  processPollenData(result) {
    // Use the correct structure from the Ambee API
    const pollenRisk = result.Risk;
    const pollenCount = result.Count;

    this.pollenData = {
      grass: `Count: ${pollenCount.grass_pollen}, Risk: ${pollenRisk.grass_pollen}`,
      tree: `Count: ${pollenCount.tree_pollen}, Risk: ${pollenRisk.tree_pollen}`,
      weed: `Count: ${pollenCount.weed_pollen}, Risk: ${pollenRisk.weed_pollen}`
    };

    this.checkIfDataLoaded();
  },

  checkIfDataLoaded() {
    // At least one of the datasets (air quality or pollen) must be loaded to update the DOM
    if (this.airQualityData || this.pollenData) {
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  },

  // Schedule periodic updates
  scheduleUpdate(delay = null) {
    const nextLoad = delay !== null ? delay : this.config.updateInterval;

    const self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      self.updateAirQuality(self);
      self.updatePollenData(self);
    }, nextLoad);
  },

  // Process socket notifications for both air quality and pollen
  socketNotificationReceived(notification, payload) {
    if (notification === "AIR_QUALITY_RESULT") {
      if (payload.data) {
        this.processAirQuality(payload.data);
      } else {
        console.error("[MMM-airquality] Air quality data failed to load.");
      }
    } else if (notification === "POLLEN_RESULT") {
      if (payload.data) {
        this.processPollenData(payload.data);
      } else {
        console.error("[MMM-airquality] Pollen data failed to load.");
      }
    }
  }
});
