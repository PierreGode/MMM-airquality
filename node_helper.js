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

    if (!this.loaded) {
      wrapper.innerHTML = "Loading air quality and pollen data...";
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
      const cityAQIWrapper = document.createElement("div");
      cityAQIWrapper.className = "city-aqi";

      const city = document.createElement("div");
      city.className = "city";
      city.innerHTML = this.airQualityData.city;
      cityAQIWrapper.appendChild(city);

      const aqi = document.createElement("div");
      aqi.className = "aqi";
      aqi.innerHTML = this.airQualityData.aqiUS;
      cityAQIWrapper.appendChild(aqi);

      wrapper.appendChild(cityAQIWrapper);

      // Weather Data Display
      const weatherTable = document.createElement("table");
      weatherTable.className = "small weather-data";

      const weatherParams = {
        "Temperature": `${this.airQualityData.temperature}°C`,
        "Humidity": `${this.airQualityData.humidity}%`,
        "Pressure": `${this.airQualityData.pressure} hPa`,
        "Wind Speed": `${this.airQualityData.windSpeed} m/s`,
        "Wind Direction": `${this.airQualityData.windDirection}°`,
      };

      for (const [label, value] of Object.entries(weatherParams)) {
        const weatherRow = document.createElement("tr");

        const labelCell = document.createElement("td");
        labelCell.innerHTML = label;
        weatherRow.appendChild(labelCell);

        const valueCell = document.createElement("td");
        valueCell.innerHTML = value;
        weatherRow.appendChild(valueCell);

        weatherTable.appendChild(weatherRow);
      }

      wrapper.appendChild(weatherTable);
    }

    // Pollen Data Display
    if (this.pollenData) {
      const pollenTable = document.createElement("table");
      pollenTable.className = "small pollen-data";

      const pollenParams = {
        "Grass Pollen": this.pollenData.grass,
        "Tree Pollen": this.pollenData.tree,
        "Weed Pollen": this.pollenData.weed,
      };

      // Filter pollen types based on config
      this.config.pollenTypes.forEach((pollenType) => {
        let label = "";
        switch (pollenType) {
          case "grass":
            label = "Grass Pollen";
            break;
          case "tree":
            label = "Tree Pollen";
            break;
          case "weed":
            label = "Weed Pollen";
            break;
        }

        if (label) {
          const pollenRow = document.createElement("tr");

          const labelCell = document.createElement("td");
          labelCell.innerHTML = label;
          pollenRow.appendChild(labelCell);

          const valueCell = document.createElement("td");
          valueCell.innerHTML = pollenParams[label];
          pollenRow.appendChild(valueCell);

          pollenTable.appendChild(pollenRow);
        }
      });

      wrapper.appendChild(pollenTable);
    }

    return wrapper;
  },

  processAirQuality(result) {
    this.airQualityData = result;
    this.checkIfDataLoaded();
  },

  processPollenData(result) {
    this.pollenData = result;
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
