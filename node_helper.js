const Log = require("logger");
const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start() {
    Log.log("[MMM-airquality] Node Helper started");
  },

  socketNotificationReceived(notification, payload) {
    Log.log(`[MMM-airquality] Received socket notification: ${notification}`);
    if (notification === "GET_DATA") {
      Log.log("[MMM-airquality] Fetching data for pollen, air quality, and pollen forecast...");
      this.getData(payload.apiKey, payload.latitude, payload.longitude);
    }
  },

  async getData(apiKey, latitude, longitude) {
    const self = this;
    const tomorrowAPIUrl = "https://api.tomorrow.io/v4/timelines";

    // Common parameters for the API calls
    const queryParams = new URLSearchParams({
      location: `${latitude},${longitude}`,
      fields: [
        "particulateMatter25",   // PM2.5
        "particulateMatter10",   // PM10
        "pollutantO3",           // Ozone
        "pollutantNO2",          // Nitrogen Dioxide
        "pollutantCO",           // Carbon Monoxide
        "pollutantSO2",          // Sulfur Dioxide
        "treeIndex",             // Tree pollen index
        "grassIndex",            // Grass pollen index
        "weedIndex"              // Weed pollen index
      ].join(','),
      units: "metric",  // You can switch to "imperial" if needed
      timesteps: "1d",  // Daily data
      startTime: new Date().toISOString(),  // Current time
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),  // 5 days forecast
      apikey: apiKey
    });

    const headers = {
      "Content-Type": "application/json"
    };

    try {
      // Fetch Air Quality and Pollen Data from Tomorrow.io API
      const response = await fetch(`${tomorrowAPIUrl}?${queryParams.toString()}`, { headers });
      if (!response.ok) {
        throw new Error(`[MMM-airquality] Error fetching data: ${response.status}`);
      }
      const data = await response.json();

      const pollenData = this.processPollenData(data);
      const airQualityData = this.processAirQualityData(data);

      self.sendSocketNotification("POLLEN_RESULT", { data: pollenData });
      self.sendSocketNotification("AIR_QUALITY_RESULT", { data: airQualityData });
      Log.log("[MMM-airquality] Air quality and pollen data fetched");
    } catch (error) {
      Log.error("[MMM-airquality] Error fetching data: " + error);
    }
  },

  processPollenData(data) {
    const pollenData = {
      tree_pollen: data.data.timelines[0].intervals[0].values.treeIndex,
      grass_pollen: data.data.timelines[0].intervals[0].values.grassIndex,
      weed_pollen: data.data.timelines[0].intervals[0].values.weedIndex
    };

    return {
      Count: pollenData,
      Risk: {
        tree_pollen: this.getPollenRisk(pollenData.tree_pollen),
        grass_pollen: this.getPollenRisk(pollenData.grass_pollen),
        weed_pollen: this.getPollenRisk(pollenData.weed_pollen)
      }
    };
  },

  processAirQualityData(data) {
    return {
      AQI: data.data.timelines[0].intervals[0].values.particulateMatter25,
      PM10: data.data.timelines[0].intervals[0].values.particulateMatter10,
      O3: data.data.timelines[0].intervals[0].values.pollutantO3,
      NO2: data.data.timelines[0].intervals[0].values.pollutantNO2,
      CO: data.data.timelines[0].intervals[0].values.pollutantCO,
      SO2: data.data.timelines[0].intervals[0].values.pollutantSO2,
      city: "Your Location", // Placeholder for location name
      aqiInfo: { category: this.getAQICategory(data.data.timelines[0].intervals[0].values.particulateMatter25) }
    };
  },

  getPollenRisk(index) {
    if (index === 0) return "None";
    else if (index === 1) return "Very Low";
    else if (index === 2) return "Low";
    else if (index === 3) return "Medium";
    else if (index === 4) return "High";
    else return "Very High";
  },

  getAQICategory(aqi) {
    if (aqi <= 50) return "Good";
    else if (aqi <= 100) return "Moderate";
    else if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    else if (aqi <= 200) return "Unhealthy";
    else if (aqi <= 300) return "Very Unhealthy";
    else return "Hazardous";
  }
});
