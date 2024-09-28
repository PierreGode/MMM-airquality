Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",
    latitude: "",
    longitude: "",
    updateInterval: 30 * 60 * 1000, // Update every 30 minutes
    animationSpeed: 1000, // Animation speed in milliseconds
    pollutants: ["o3", "pm10", "pm25", "no2", "co", "so2"], // Pollutants to display
    debug: false,
  },

  start() {
    Log.info(`Starting module: ${this.name}`);
    this.loaded = false;
    this.airQualityData = null;
    this.scheduleUpdate();
    this.updateTimer = null;
    this.apiBase = `https://api.airvisual.com/v2/nearest_city?lat=${this.config.latitude}&lon=${this.config.longitude}&key=${this.config.apiKey}`;
    if (this.config.debug) {
      Log.info("API URL:", this.apiBase);
    }
    this.updateAirQuality(this);
  },

  updateAirQuality(self) {
    self.sendSocketNotification("GET_AIR_QUALITY", {
      apiKey: self.config.apiKey,
      latitude: self.config.latitude,
      longitude: self.config.longitude
    });
  },

  getStyles() {
    return ["MMM-airquality.css"];
  },

  getHeader() {
    return this.data.header || "Air Quality Index (AQI)";
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading air quality data...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.airQualityData) {
      wrapper.innerHTML = "No air quality data available.";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

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

    // Pollutants Display
    const pollutantsTable = document.createElement("table");
    pollutantsTable.className = "small data";

    this.config.pollutants.forEach((pollutant) => {
      if (this.airQualityData[pollutant]) {
        const pollutantRow = document.createElement("tr");

        const pollutantName = document.createElement("td");
        pollutantName.className = `pollutant-label ${pollutant}`;
        pollutantName.innerHTML = pollutant.toUpperCase();
        pollutantRow.appendChild(pollutantName);

        const pollutantValue = document.createElement("td");
        pollutantValue.className = `pollutant-value ${pollutant}`;
        pollutantValue.innerHTML = this.airQualityData[pollutant];
        pollutantRow.appendChild(pollutantValue);

        pollutantsTable.appendChild(pollutantRow);
      }
    });

    wrapper.appendChild(pollutantsTable);
    return wrapper;
  },

  processAirQuality(result) {
    this.airQualityData = {
      city: result.city,
      aqiUS: result.aqiUS,
      temperature: result.temperature,
      pressure: result.pressure,
      humidity: result.humidity,
      windSpeed: result.windSpeed,
      windDirection: result.windDirection
    };

    this.config.pollutants.forEach((pollutant) => {
      this.airQualityData[pollutant] = result[pollutant] || "-";
    });

    this.loaded = true;
    this.updateDom(this.config.animationSpeed);
  },

  scheduleUpdate(delay = null) {
    const nextLoad = delay !== null ? delay : this.config.updateInterval;

    const self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      self.updateAirQuality(self);
    }, nextLoad);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "AIR_QUALITY_RESULT") {
      this.processAirQuality(payload.data);
      this.scheduleUpdate(this.config.updateInterval);
    }
  },
});
