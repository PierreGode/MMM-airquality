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
To use this module, you will need to configure it in your config.js file of MagicMirror. You can obtain an API key from https://auth.ambeedata.com/users/register?redirectUrl=https://api-dashboard.getambee.com.

Here is an example of the configuration:
```bash
{
  module: "MMM-airquality",
  position: "top_right",  // Example position
  config: {
    apiKey: "YOUR_AMBEE_API_KEY",  // Your Ambee API key
    latitude: "59.3293",           // Your latitude
    longitude: "18.0686",          // Your longitude
    updateInterval: 900000,        // Optional, default is 15 minutes (max 96 calls/day)
    animationSpeed: 1000           // Optional, default is 1 second
  },
},

```


### Configuration Options 
| Option | Description | 
| --- | --- | 
| `apiKey` | **Required**: Your AirVisual API key. Get it from here. | 
| `latitude` | **Required**: Your location's latitude. Example: `"59.3293"` for Stockholm. | 
| `longitude` | **Required**: Your location's longitude. Example: `"18.0686"` for Stockholm. | |
