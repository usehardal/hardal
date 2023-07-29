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
declare function SendToHardal(config: Config): void;
export default SendToHardal;
