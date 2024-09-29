Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",           // Ambee API Key
    latitude: "",         // Latitude of your location
    longitude: "",        // Longitude of your location
    updateInterval: 900000, // Update every 15 minutes (max 96 calls/day)
    animationSpeed: 1000, // Animation speed in milliseconds
    units: "si",          // Units to be passed to API (e.g., si for Celsius)
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
      longitude: self.config.longitude,
      units: self.config.units
    });
  },

  getStyles() {
    return ["MMM-airquality.css", "weather-icons.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading data...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.weatherData || !this.pollenData || !this.airQualityData) {
      wrapper.innerHTML = "No data available.";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    const mainWrapper = document.createElement("div");

    // City
    const city = document.createElement("div");
    city.className = "city bright large light";
    city.innerHTML = this.weatherData.city || "Unknown Location";
    mainWrapper.appendChild(city);

    // Current Weather Wrapper
    const currentWeatherWrapper = document.createElement("div");
    currentWeatherWrapper.className = "current-weather";

    // Weather Icon
    const iconElement = document.createElement("span");
    iconElement.className = `wi weathericon wi-${this.weatherData.icon}`;
    currentWeatherWrapper.appendChild(iconElement);

    // Temperature
    const temperature = document.createElement("div");
    temperature.className = "temperature bright xlarge light";
    temperature.innerHTML = `${this.weatherData.temperature}°`;
    currentWeatherWrapper.appendChild(temperature);

    mainWrapper.appendChild(currentWeatherWrapper);

    // AQI
    const aqi = document.createElement("div");
    aqi.className = "aqi bright small light";
    aqi.innerHTML = `AQI: ${this.airQualityData.AQI} (${this.airQualityData.aqiInfo.category})`;
    mainWrapper.appendChild(aqi);

    // Weather Details
    const weatherDetails = document.createElement("div");
    weatherDetails.className = "weather-details xsmall dimmed";
    weatherDetails.innerHTML = `
      Humidity: ${this.weatherData.humidity}%<br>
      Pressure: ${this.weatherData.pressure} hPa<br>
      Wind: ${this.weatherData.windSpeed} m/s<br>
      Visibility: ${this.weatherData.visibility} km
    `;
    mainWrapper.appendChild(weatherDetails);

    // Pollen Data
    const pollenWrapper = document.createElement("div");
    pollenWrapper.className = "pollen-wrapper small bright";

    const pollenTitle = document.createElement("div");
    pollenTitle.className = "pollen-title medium bright";
    pollenTitle.innerHTML = "Pollen Count & Risk";
    pollenWrapper.appendChild(pollenTitle);

    const pollenSummary = document.createElement("div");
    pollenSummary.className = "pollen-summary small bright";
    pollenSummary.innerHTML = `
      Weed Pollen Count: ${this.pollenData.Count.weed_pollen} (${this.pollenData.Risk.weed_pollen})
    `;
    pollenWrapper.appendChild(pollenSummary);

    mainWrapper.appendChild(pollenWrapper);

    wrapper.appendChild(mainWrapper);
    return wrapper;
  },

  processWeather(data) {
    Log.info("[MMM-airquality] Weather data received");

    // Convert temperature to Celsius if units are "si"
    let temperature = data.temperature;
    if (this.config.units === "si" && temperature !== null) {
      temperature = ((temperature - 32) / 1.8).toFixed(1);
    }

    // Map the data to weatherData
    this.weatherData = {
      city: "Stockholm",  // Hardcoding city as it's not provided in the API response
      temperature: temperature || null,
      humidity: data.humidity || null,
      pressure: data.pressure || null,
      precipIntensity: data.precipIntensity || null,
      windSpeed: data.windSpeed || null,
      windGust: data.windGust || null,
      visibility: data.visibility || null,
      ozone: data.ozone || null,
      uvIndex: data.uvIndex || null,
      summary: data.summary || "No summary",
      icon: data.icon || "na"
    };

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
