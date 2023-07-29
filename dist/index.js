"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function SendToHardal(config) {
    const { apiKey, projectId, eventType, eventValue, eventData, customDomain } = config;
    const queryParams = `?projectId=${projectId}&eventType=${eventType}&eventData=${encodeURIComponent(JSON.stringify(eventData))}&eventValue=${encodeURIComponent(eventValue)}&apiKey=${apiKey}`;
    const domain = customDomain || 'beta.usehardal.com';
    const endpointURL = `https://${domain}/api/ss-collect${queryParams}`;
    const requestOptions = { method: 'POST' };
    fetch(endpointURL, requestOptions)
        .then((response) => response.json())
        .then((data) => {
        console.log(data);
    })
        .catch((error) => {
        console.error('Error:', error);
    });
}
exports.default = SendToHardal;
