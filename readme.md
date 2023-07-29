<p align="center">
  <a href="https://usehardal.com/?utm_source=github&utm_medium=gatsby_plugin_logo" target="_blank">
    <img src="https://res.cloudinary.com/raufsamestone/image/upload/v1671398927/hardal/gj5urlgigxm9axbpp1oh.svg" alt="Hardal" width="180" height="84">
  </a>
</p>

# Hardal

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://semver.org)

An official plugin to add the [Hardal](https://usehardal.com/) tracking snippet to your React JS project.

## Install

`npm install --save hardal`

or

`yarn add hardal`

## How to use

### Import module
```js
//index.ts
import SendToHardal from 'hardal'

```

### Send your custom events
```js
//index.ts
 const sendCustomEvent = () => {
    const config = {
      apiKey: '',
      projectId: 372905,
      eventType: 'click-request-demo',
      eventValue: '',
      eventData: {
        path: window.location.pathname,
        referrer: document.referrer,
        position: 'header',
        isUserLogin: false,
        // Add any properties as needed
      },
    };
    SendToHardal(config);
  }
```
In the above example, the sendCustomEvent function is called with a configuration object named config. The configuration object includes the following properties:

- `apiKey`: Your Hardal API key. Replace 'YOUR_API_KEY' with your actual API key.
- `projectId`: The ID of the project to which you want to send the event.
- `eventType`: The type of the event (e.g., 'click-request-demo').
- `eventValue`: The value associated with the event (leave it as an empty string for now, or provide a specific value if needed).
- `eventData`: An object containing additional data related to the event, such as path, referrer, product SKU, user type or any value. You can add more properties to the eventData object as needed.