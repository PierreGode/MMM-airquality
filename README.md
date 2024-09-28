# MMM-airquality

A module for the [MagicMirror²](https://magicmirror.builders) to display air quality information using data from the AirVisual API. This module provides real-time air quality index (AQI) and other weather-related data.

## Screenshots



## Installation

1. Navigate to your MagicMirror `modules` folder:
   ```bash
   cd ~/MagicMirror/modules
  
Clone the repository:
```bash
git clone https://github.com/PierreGode/MMM-airquality.git
```
Navigate to the module folder:
```bash
cd MMM-airquality
```
Install the dependencies:
npm install

Configuration
To use this module, you will need to configure it in your config.js file of MagicMirror. You can obtain an API key from AirVisual https://dashboard.iqair.com/personal/api-keys.

Here is an example of the configuration:
```bash
{
  module: "MMM-airquality",
  position: "bottom_right",  // Adjust position to your preference
  config: {
    airQualityApiKey: "YOUR_AIR_QUALITY_API_KEY",  // Your valid IQAir API key
    pollenApiKey: "YOUR_POLLEN_API_KEY",           // Your valid Ambee API key
    latitude: "59.3293",                           // Latitude for your location (e.g., Stockholm)
    longitude: "18.0686",                          // Longitude for your location (e.g., Stockholm)
    updateInterval: 600000,                        // Update interval in milliseconds (default: 10 minutes)
    animationSpeed: 1000,                          // Animation speed in milliseconds (default: 1 second)
    
    // Configure which pollutants to display (select from "o3", "pm10", "pm25", "no2", "co", "so2")
    pollutants: ["o3", "pm10", "pm25"],            // Customize based on your needs (e.g., Ozone, PM10, PM2.5)
    
    // Configure which pollen types to display (select from "grass", "tree", "weed")
    pollenTypes: ["grass", "tree", "weed"],        // Customize based on your needs (e.g., Grass, Tree, Weed pollen)

    debug: true                                    // Enable debug mode for more logging information
  },
},
```


### Configuration Options 
| Option | Description | 
| --- | --- | 
| `apiKey` | **Required**: Your AirVisual API key. Get it from here. | 
| `latitude` | **Required**: Your location's latitude. Example: `"59.3293"` for Stockholm. | 
| `longitude` | **Required**: Your location's longitude. Example: `"18.0686"` for Stockholm. | |
