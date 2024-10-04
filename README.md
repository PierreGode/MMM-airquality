# MMM-airquality

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J2EARPK)
![Open Issues](https://img.shields.io/github/issues/PierreGode/MMM-airquality)
![Open PRs](https://img.shields.io/github/issues-pr/PierreGode/MMM-airquality)
![Visitor Count](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https://github.com/PierreGode/MMM-airquality)

A module for the [MagicMirror²](https://magicmirror.builders) to display air quality and Pollen information using data from the ambee API. This module provides real-time air quality index (AQI), other pollutants and pollen related data.

## Screenshots

![image](img/screen2.png) ![image](img/screen1.png)

## Installation

Just clone the module into your modules directory:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/PierreGode/MMM-airquality
```

## Update

Just enter the module's directory and pull the update:

```bash
cd ~/MagicMirror/modules/MMM-NHL
git pull
```

## Configuration

To use this module, you need to configure it in your config.js file of MagicMirror.

You can obtain an API key from [ambee API](https://auth.ambeedata.com/users/register?redirectUrl=https://api-dashboard.getambee.com)

### Configuration Example

Here is an example of the configuration:

```js
{
  module: "MMM-airquality",
  position: "bottom_right",
  config: {
    apiKey: "YOUR_AMBEE_API_KEY",
    latitude: "59.3293",  // Stockholm
    longitude: "18.0686", // Stockholm
    showPM10: true,
    showPM25: true,
    updateInterval: 3600000,
    animationSpeed: 1000,
    showPollenForecast: true,
    showGrassPollen: true,
    showTreePollen: true,
    showWeedPollen: true,
    startsilentHour: 23, // Begin ignore period at 23:00
    endsilentHour: 6,    // End ignore period at 06:00
    debug: false
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

## Errors

[ERROR]
[MMM-airquality] Error fetching pollen data: 422: <p>This will mean that you have reached your 100 daily API call limmit. try setting updateInterval: to a higher number.
