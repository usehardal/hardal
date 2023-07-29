interface EventData {
    [key: string]: any;
}

interface Config {
    apiKey: string;
    projectId: number;
    eventType: string;
    eventValue: string | number;
    eventData: EventData;
    customDomain?: string;
}

function SendToHardal(config: Config): void {
    const { apiKey, projectId, eventType, eventValue, eventData, customDomain } = config;

    const queryParams = `?projectId=${projectId}&eventType=${eventType}&eventData=${encodeURIComponent(
        JSON.stringify(eventData)
    )}&eventValue=${encodeURIComponent(eventValue)}&apiKey=${apiKey}`;

    const domain = customDomain || 'beta.usehardal.com';
    const endpointURL = `https://${domain}/api/ss-collect${queryParams}`;

    const requestOptions: RequestInit = { method: 'POST' };

    fetch(endpointURL, requestOptions)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

export default SendToHardal;
