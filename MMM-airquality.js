Module.register("MMM-airquality", {
  defaults: {
    apiKey: "",           // Ambee API Key
    latitude: "",         // Latitude of your location
    longitude: "",        // Longitude of your location
    updateInterval: 900000, // Update every 15 minutes (max 96 calls/day)
    animationSpeed: 1000, // Animation speed in milliseconds
    units: "si",          // Units to be passed to API (e.g., si for Celsius)
    showPollenForecast: true, // Option to control pollen forecast display
    showPM10: true,       // Option to show or hide PM10
    showPM25: true,       // Option to show or hide PM2.5
    showGrassPollen: true, // Option to show or hide Grass pollen
    showTreePollen: true,  // Option to show or hide Tree pollen
    showWeedPollen: true,  // Option to show or hide Weed pollen
    debug: false,
  },

  start() {
    Log.info(`[MMM-airquality] Starting module: ${this.name}`);
    this.loaded = false;
    this.pollenData = null;
    this.airQualityData = null;
    this.pollenForecastData = null;
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
    if (this.config.showPM10 && this.airQualityData.PM10) {
      pmData += `PM10: ${this.airQualityData.PM10}`;
    }
    if (this.config.showPM25 && this.airQualityData.PM25) {
      pmData += ` | PM2.5: ${this.airQualityData.PM25}`;
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
    const species = this.pollenData.Species;

    let pollenAvailable = false;

    if (this.config.showGrassPollen && counts.grass_pollen > 0) {
      const grassDiv = document.createElement("div");
      grassDiv.innerHTML = `Grass Pollen: ${counts.grass_pollen} (${risks.grass_pollen})`;
      pollenCounts.appendChild(grassDiv);
      pollenAvailable = true;
      
      // Add Grass species
      const grassSpecies = species.Grass;
      const grassSpeciesDiv = document.createElement("div");
      grassSpeciesDiv.className = "pollen-species xsmall dimmed";
      let grassSpeciesHTML = '';
      for (let sp in grassSpecies) {
        if (grassSpecies[sp] > 0) {
          grassSpeciesHTML += `${sp}: ${grassSpecies[sp]}<br>`;
        }
      }
      grassSpeciesDiv.innerHTML = grassSpeciesHTML;
      pollenCounts.appendChild(grassSpeciesDiv);
    }

    if (this.config.showTreePollen && counts.tree_pollen > 0) {
      const treeDiv = document.createElement("div");
      treeDiv.innerHTML = `Tree Pollen: ${counts.tree_pollen} (${risks.tree_pollen})`;
      pollenCounts.appendChild(treeDiv);
      pollenAvailable = true;
      
      // Add Tree species
      const treeSpecies = species.Tree;
      const treeSpeciesDiv = document.createElement("div");
      treeSpeciesDiv.className = "pollen-species xsmall dimmed";
      let treeSpeciesHTML = '';
      for (let sp in treeSpecies) {
        if (treeSpecies[sp] > 0) {
          treeSpeciesHTML += `${sp}: ${treeSpecies[sp]}<br>`;
        }
      }
      treeSpeciesDiv.innerHTML = treeSpeciesHTML;
      pollenCounts.appendChild(treeSpeciesDiv);
    }

    if (this.config.showWeedPollen && counts.weed_pollen > 0) {
      const weedDiv = document.createElement("div");
      weedDiv.innerHTML = `Weed Pollen: ${counts.weed_pollen} (${risks.weed_pollen})`;
      pollenCounts.appendChild(weedDiv);
      pollenAvailable = true;
      
      // Add Weed species
      const weedSpecies = species.Weed;
      const weedSpeciesDiv = document.createElement("div");
      weedSpeciesDiv.className = "pollen-species xsmall dimmed";
      let weedSpeciesHTML = '';
      for (let sp in weedSpecies) {
        if (weedSpecies[sp] > 0) {
          weedSpeciesHTML += `${sp}: ${weedSpecies[sp]}<br>`;
        }
      }
      weedSpeciesDiv.innerHTML = weedSpeciesHTML;
      pollenCounts.appendChild(weedSpeciesDiv);
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
      const time = entry.time;
      const date = new Date(time * 1000);
      const day = date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });

      if (!dayMap[day]) {
        dayMap[day] = {
          date: date,
          countsList: {
            grass_pollen: [],
            tree_pollen: [],
            weed_pollen: []
          },
          risksList: {
            grass_pollen: [],
            tree_pollen: [],
            weed_pollen: []
          }
        };
      }

      dayMap[day].countsList.grass_pollen.push(entry.Count.grass_pollen || 0);
      dayMap[day].countsList.tree_pollen.push(entry.Count.tree_pollen || 0);
      dayMap[day].countsList.weed_pollen.push(entry.Count.weed_pollen || 0);

      dayMap[day].risksList.grass_pollen.push(entry.Risk.grass_pollen);
      dayMap[day].risksList.tree_pollen.push(entry.Risk.tree_pollen);
      dayMap[day].risksList.weed_pollen.push(entry.Risk.weed_pollen);
    });

    const dayArray = Object.values(dayMap).sort((a, b) => a.date - b.date);

    const forecastDataProcessed = dayArray.map((dayData, index) => {
      const countsList = dayData.countsList;
      const risksList = dayData.risksList;

      const counts = {
        grass_pollen: this.average(countsList.grass_pollen),
        tree_pollen: this.average(countsList.tree_pollen),
        weed_pollen: this.average(countsList.weed_pollen)
      };

      const riskLevelsOrder = ["Low", "Moderate", "High", "Very High"];
      const risks = {
        grass_pollen: this.highestRisk(risksList.grass_pollen, riskLevelsOrder),
        tree_pollen: this.highestRisk(risksList.tree_pollen, riskLevelsOrder),
        weed_pollen: this.highestRisk(risksList.weed_pollen, riskLevelsOrder)
      };

      const maxCount = Math.max(counts.grass_pollen, counts.tree_pollen, counts.weed_pollen);

      const highestPollenTypes = [];
      ["grass_pollen", "tree_pollen", "weed_pollen"].forEach(source => {
        if (counts[source] === maxCount && counts[source] > 0) {
          highestPollenTypes.push({
            source: source.replace('_pollen', '').replace(/\b\w/g, l => l.toUpperCase()),
            risk: risks[source],
            count: Math.round(counts[source])
          });
        }
      });

      let weekday;
      const today = new Date();
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
        highestPollenTypes: highestPollenTypes
      };
    });

    return forecastDataProcessed;
  },

  average(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
  },

  highestRisk(risksArray, riskLevelsOrder) {
    let highestRisk = "Low";
    risksArray.forEach(risk => {
      if (riskLevelsOrder.indexOf(risk) > riskLevelsOrder.indexOf(highestRisk)) {
        highestRisk = risk;
      }
    });
    return highestRisk;
  },

  processAirQuality(data) {
    Log.info("[MMM-airquality] Air quality data received");
    this.airQualityData = data;
    this.checkIfDataLoaded();
  },

  processPollen(data) {
    Log.info("[MMM-airquality] Pollen data received");
    Log.debug("[MMM-airquality] Pollen data payload:", data);

    if (data.data && data.data.length > 0) {
      this.pollenData = data.data[0];
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
      this.scheduleUpdate();
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
