# MMM-airquality

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J2EARPK)  ![Open Issues](https://img.shields.io/github/issues/PierreGode/MMM-airquality) ![Open PRs](https://img.shields.io/github/issues-pr/PierreGode/MMM-airquality)



![image](https://github.com/user-attachments/assets/778da9d0-7f6c-438e-b0e1-cedc12642b47) ![image](https://github.com/user-attachments/assets/7afe5087-df9f-4d4d-abba-8d67eab04661)





A module for the [MagicMirror²](https://magicmirror.builders) to display air quality and Pollen information using data from the ambee API. This module provides real-time air quality index (AQI), other pollutants and pollen related data.


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
To use this module, you will need to configure it in your config.js file of MagicMirror. You can obtain an API key from https://auth.ambeedata.com/users/register?redirectUrl=https://api-dashboard.getambee.com.

Here is an example of the configuration:
```bash
{
  module: "MMM-airquality",
  position: "bottom_right",            // Choose any position you'd like
  config: {
    apiKey: "YOUR_AMBEE_API_KEY",      // Replace with your Ambee API Key
    latitude: "59.3293",               // Latitude of your location (Stockholm in this example)
    longitude: "18.0686",              // Longitude of your location
    showPM10: true,                    // Show PM10 data
    showPM25: true,                    // Show PM2.5 data
    updateInterval: 3600000,           // Update every hour
    animationSpeed: 1000,              // 1 second for DOM animations
    showPollenForecast: true,          // Control pollen forecast display
    showGrassPollen: true,             // New option to show or hide Grass pollen
    showTreePollen: true,              // New option to show or hide Tree pollen
    showWeedPollen: true,              // New option to show or hide Weed pollen
    debug: false                       // Set to true to enable logging for debugging
  },
},



```


### Configuration Options 
| Option | Description | 
| --- | --- | 
| `apiKey` | **Required**: Your AirVisual API key. Get it from here. | 
| `latitude` | **Required**: Your location's latitude. Example: `"59.3293"` for Stockholm. | 
| `longitude` | **Required**: Your location's longitude. Example: `"18.0686"` for Stockholm. |
| `showPM10` | Show or Hide ( true : false )  PM10 data. |
| `showPM25` | Show or Hide ( true : false ) PM10 data. |
