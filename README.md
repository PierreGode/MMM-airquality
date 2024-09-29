# MMM-airquality

![image](https://github.com/user-attachments/assets/e6643cd2-e12c-4edb-bf4e-c126897f93f3)


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
To use this module, you will need to configure it in your config.js file of MagicMirror. You can obtain an API key from https://auth.ambeedata.com/users/register?redirectUrl=https://api-dashboard.getambee.com.

Here is an example of the configuration:
```bash
{
  module: "MMM-airquality",
  position: "bottom_right",  // Choose any position you'd like
  config: {
    apiKey: "YOUR_AMBEE_API_KEY",    // Replace with your Ambee API Key
    latitude: "59.3293",             // Latitude of your location (Stockholm in this example)
    longitude: "18.0686",            // Longitude of your location
    updateInterval: 3600000,          // Update every hour 100 calls a day limitation from api and we call several endpoints.
    animationSpeed: 1000,            // 1 second for DOM animations
    debug: false                     // Set to true to enable logging for debugging
  },
},


```


### Configuration Options 
| Option | Description | 
| --- | --- | 
| `apiKey` | **Required**: Your AirVisual API key. Get it from here. | 
| `latitude` | **Required**: Your location's latitude. Example: `"59.3293"` for Stockholm. | 
| `longitude` | **Required**: Your location's longitude. Example: `"18.0686"` for Stockholm. | |
