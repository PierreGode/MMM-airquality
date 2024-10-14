Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",           // Tomorrow.io API Key
    latitude: "",         // Latitude of your location
    longitude: "",        // Longitude of your location
    updateInterval: 900000, // Update every 15 minutes (max 96 calls/day)
    animationSpeed: 1000, // Animation speed in milliseconds
    units: "metric",      // Units to be passed to API (metric or imperial)
    showPollenForecast: true, // Option to control pollen forecast display
    showPM10: true,       // Option to show or hide PM10
    showPM25: true,       // Option to show or hide PM2.5
    showGrassPollen: true, // Option to show or hide Grass pollen
    showTreePollen: true,  // Option to show or hide Tree pollen
    showWeedPollen: true,  // Option to show or hide Weed pollen
    startsilentHour: 23,  // Begin ignore period at 23:00
    endsilentHour: 6,     // End ignore period at 06:00
    debug: false,
  },

  start() {
    Log.info(`[MMM-airquality] Starting module: ${this.name}`);
    this.loaded = false;
    this.pollenData = null;
    this.airQualityData = null;
    this.pollenForecastData = null;
    this.updateTimer = null;

    if (this.config.debug) {
      Log.info("[MMM-airquality] Debug mode ON");
    }
    Log.info("[MMM-airquality] Initializing data fetch...");
    this.updateData(this);
    this.scheduleUpdate();
  },

  isSilentHour() {
    const now = new Date();
    const currentHour = now.getHours();
    const { startsilentHour, endsilentHour } = this.config;
    if (startsilentHour > endsilentHour) {
      // Silent hours wrap around midnight
      return currentHour >= startsilentHour || currentHour < endsilentHour;
    } else {
      return currentHour >= startsilentHour && currentHour < endsilentHour;
    }
  },

  updateData(self) {
    if (!this.isSilentHour()) {
      Log.info("[MMM-airquality] Sending socket notification to fetch data...");
      self.sendSocketNotification("GET_DATA", {
        apiKey: self.config.apiKey,
        latitude: self.config.latitude,
        longitude: self.config.longitude,
        units: self.config.units
      });
    } else {
      Log.info("[MMM-airquality] Silent hours active, skipping API call.");
    }
  },

  getStyles() {
    return ["MMM-airquality.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading data...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.pollenData || !this.airQualityData || !this.pollenForecastData) {
      wrapper.innerHTML = "No data available.";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    const mainWrapper = document.createElement("div");

    // Row 1: City and AQI
    const cityAqi = document.createElement("div");
    cityAqi.className = "city-aqi bright medium light";
    const city = this.airQualityData.city || "Unknown Location";
    const aqi = this.airQualityData.AQI || "N/A";
    const aqiCategory = (this.airQualityData.aqiInfo && this.airQualityData.aqiInfo.category) || "N/A";
    cityAqi.innerHTML = `${city} | AQI ${aqi} (${aqiCategory})`;
    mainWrapper.appendChild(cityAqi);

    // Row 2: Particulate Matter (PM10 and PM2.5 if enabled)
    const pmInfo = document.createElement("div");
    pmInfo.className = "pm-info small";
    let pmData = "";

    // Check if PM10 is visible
    if (this.config.showPM10 && this.airQualityData.PM10) {
      pmData += `PM10: ${this.airQualityData.PM10}`;
    }

    // Add pipe only if both PM10 and PM2.5 are visible
    if (this.config.showPM10 && this.airQualityData.PM10 && this.config.showPM25 && this.airQualityData.PM25) {
      pmData += " | ";
    }

    // Check if PM2.5 is visible
    if (this.config.showPM25 && this.airQualityData.AQI) {
      pmData += `PM2.5: ${this.airQualityData.AQI}`;
    }

    pmInfo.innerHTML = pmData;
    mainWrapper.appendChild(pmInfo);

    // Row 3: "Pollen count"
    const pollenCountTitle = document.createElement("div");
    pollenCountTitle.className = "pollen-count-title small bright";
    pollenCountTitle.innerHTML = "Pollen count";
    mainWrapper.appendChild(pollenCountTitle);

    // Row 4: Today's pollen counts and species
    const pollenCounts = document.createElement("div");
    pollenCounts.className = "pollen-counts small bright";
    const counts = this.pollenData.Count;
    const risks = this.pollenData.Risk;

    let pollenAvailable = false;

    if (this.config.showGrassPollen && counts.grass_pollen > 0) {
      const grassDiv = document.createElement("div");
      grassDiv.innerHTML = `Grass Pollen: ${counts.grass_pollen} (${risks.grass_pollen})`;
      pollenCounts.appendChild(grassDiv);
      pollenAvailable = true;
    }

    if (this.config.showTreePollen && counts.tree_pollen > 0) {
      const treeDiv = document.createElement("div");
      treeDiv.innerHTML = `Tree Pollen: ${counts.tree_pollen} (${risks.tree_pollen})`;
      pollenCounts.appendChild(treeDiv);
      pollenAvailable = true;
    }

    if (this.config.showWeedPollen && counts.weed_pollen > 0) {
      const weedDiv = document.createElement("div");
      weedDiv.innerHTML = `Weed Pollen: ${counts.weed_pollen} (${risks.weed_pollen})`;
      pollenCounts.appendChild(weedDiv);
      pollenAvailable = true;
    }

    if (!pollenAvailable) {
      pollenCounts.innerHTML = "No Pollen";
    }

    mainWrapper.appendChild(pollenCounts);

    // Conditionally show the pollen forecast only if pollen is found in the selected types
    if (this.config.showPollenForecast) {
      const forecastData = this.processForecastData(this.pollenForecastData);

      const forecastHasSelectedPollen = forecastData.some(dayData =>
        dayData.highestPollenTypes.some(pollenType =>
          (pollenType.source === "Grass" && this.config.showGrassPollen) ||
          (pollenType.source === "Tree" && this.config.showTreePollen) ||
          (pollenType.source === "Weed" && this.config.showWeedPollen)
        )
      );

      if (forecastHasSelectedPollen) {
        const separator = document.createElement("hr");
        separator.className = "separator";
        mainWrapper.appendChild(separator);

        const forecastTitle = document.createElement("div");
        forecastTitle.className = "forecast-title small bright";
        forecastTitle.innerHTML = "Pollen Forecast";
        mainWrapper.appendChild(forecastTitle);

        const forecastTable = document.createElement("table");
        forecastTable.className = "forecast-table small";

        const headerRow = document.createElement("tr");
        const dayHeader = document.createElement("th");
        dayHeader.innerHTML = "Day";
        const pollenTypeHeader = document.createElement("th");
        pollenTypeHeader.innerHTML = "Pollen Type";
        const riskHeader = document.createElement("th");
        riskHeader.innerHTML = "Risk Level";
        const countHeader = document.createElement("th");
        countHeader.innerHTML = "Count";

        headerRow.appendChild(dayHeader);
        headerRow.appendChild(pollenTypeHeader);
        headerRow.appendChild(riskHeader);
        headerRow.appendChild(countHeader);
        forecastTable.appendChild(headerRow);

        forecastData.forEach(dayData => {
          dayData.highestPollenTypes.forEach(pollenType => {
            if (
              (pollenType.source === "Grass" && this.config.showGrassPollen) ||
              (pollenType.source === "Tree" && this.config.showTreePollen) ||
              (pollenType.source === "Weed" && this.config.showWeedPollen)
            ) {
              const row = document.createElement("tr");
              row.className = "forecast-row";

              const dayCell = document.createElement("td");
              dayCell.innerHTML = dayData.weekday;
              row.appendChild(dayCell);

              const pollenTypeCell = document.createElement("td");
              pollenTypeCell.innerHTML = pollenType.source;
              row.appendChild(pollenTypeCell);

              const riskCell = document.createElement("td");
              riskCell.innerHTML = pollenType.risk;
              row.appendChild(riskCell);

              const countCell = document.createElement("td");
              countCell.innerHTML = pollenType.count;
              row.appendChild(countCell);

              forecastTable.appendChild(row);
            }
          });
        });

        mainWrapper.appendChild(forecastTable);
      }
    }

    wrapper.appendChild(mainWrapper);
    return wrapper;
  },

  processForecastData(forecastData) {
    const dayMap = {};

    forecastData.forEach(entry => {
      const date = new Date(entry.time * 1000);
      const day = date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });

      if (!dayMap[day]) {
        dayMap[day] = {
          date: date,
          highestPollenTypes: []
        };
      }

      const pollenCounts = entry.values;
      ["tree_pollen", "grass_pollen", "weed_pollen"].forEach(type => {
        if (pollenCounts[type] > 0) {
          dayMap[day].highestPollenTypes.push({
            source: type.replace('_pollen', '').replace(/\b\w/g, l => l.toUpperCase()),
            risk: this.getPollenRisk(pollenCounts[type]),
            count: pollenCounts[type]
          });
        }
      });
    });

    return Object.values(dayMap).sort((a, b) => a.date - b.date).map(dayData => {
      let weekday;
      const today = new Date(Date.now());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (dayData.date.toDateString() === today.toDateString()) {
        weekday = "Today";
      } else if (dayData.date.toDateString() === tomorrow.toDateString()) {
        weekday = "Tomorrow";
      } else {
        weekday = dayData.date.toLocaleDateString(undefined, { weekday: 'long' });
      }

      return {
        weekday: weekday,
        highestPollenTypes: dayData.highestPollenTypes
      };
    });
  },

  getPollenRisk(index) {
    if (index === 0) return "None";
    else if (index === 1) return "Very Low";
    else if (index === 2) return "Low";
    else if (index === 3) return "Medium";
    else if (index === 4) return "High";
    else return "Very High";
  },

  processAirQuality(data) {
    Log.info("[MMM-airquality] Air quality data received");
    this.airQualityData = data;
    this.checkIfDataLoaded();
  },

  processPollen(data) {
    Log.info("[MMM-airquality] Pollen data received");
    Log.debug("[MMM-airquality] Pollen data payload:", data);

    if (data.data) {
      this.pollenData = data.data;
    } else {
      Log.error("[MMM-airquality] Pollen data is empty");
      this.pollenData = {};
    }
    this.checkIfDataLoaded();
  },

  processPollenForecast(data) {
    Log.info("[MMM-airquality] Pollen forecast data received");
    this.pollenForecastData = data;
    this.checkIfDataLoaded();
  },

  checkIfDataLoaded() {
    if (this.airQualityData && this.pollenData && this.pollenForecastData) {
      Log.info("[MMM-airquality] All data loaded, updating DOM");
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    } else {
      Log.info("[MMM-airquality] Data still loading...");
    }
    // Schedule the next update
    this.scheduleUpdate();
  },

  scheduleUpdate(delay = null) {
    let nextLoad;
    if (delay !== null) {
      nextLoad = delay;
    } else {
      if (this.isSilentHour()) {
        // Calculate time until endsilentHour
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        let targetHour = this.config.endsilentHour;
        let hoursUntilTarget = (targetHour - currentHour + 24) % 24;
        let minutesUntilTarget = -currentMinute;
        let secondsUntilTarget = -currentSecond;
        let millisecondsUntilTarget = ((hoursUntilTarget * 60 + minutesUntilTarget) * 60 + secondsUntilTarget) * 1000;
        if (millisecondsUntilTarget <= 0) {
          millisecondsUntilTarget += 24 * 60 * 60 * 1000;
        }
        nextLoad = millisecondsUntilTarget;
        Log.info(`[MMM-airquality] Silent hours active, scheduling next update at endsilentHour in ${Math.round(nextLoad/1000/60)} minutes.`);
      } else {
        nextLoad = this.config.updateInterval;
      }
    }
    const self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      Log.info("[MMM-airquality] Scheduling next data fetch");
      self.updateData(self);
    }, nextLoad);
  },

  socketNotificationReceived(notification, payload) {
    Log.info(`[MMM-airquality] Socket notification received: ${notification}`);
    Log.debug(`[MMM-airquality] Payload for ${notification}:`, payload);
    if (notification === "AIR_QUALITY_RESULT") {
      this.processAirQuality(payload.data);
    } else if (notification === "POLLEN_RESULT") {
      this.processPollen(payload.data);
    } else if (notification === "POLLEN_FORECAST_RESULT") {
      this.processPollenForecast(payload.data);
    }
  }
});
