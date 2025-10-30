export interface HardalConfig {
  website?: string;
  signal?: string;
  hostUrl?: string;
  autoTrack?: boolean;
  doNotTrack?: boolean;
  excludeSearch?: boolean;
  excludeHash?: boolean;
  domains?: string[];
}

export interface EventQueueItem {
  event: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface BasePayload {
  signal: string;
  screen: string;
  language: string;
  title: string;
  hostname: string;
  url: string;
  referrer: string;
  distinct_id: string;
  device_type: string;
  browser_name: string;
  browser_version: string;
  viewport_size: string;
  device_pixel_ratio: number;
  timezone: string;
  platform: string;
  created_at: Date;
  timestamp: number;
}

export interface TrackEventPayload extends BasePayload {
  name: string;
  data?: Record<string, any>;
}

export interface HardalInstance {
  track: (eventName: string | Record<string, any> | ((payload: BasePayload) => any), data?: Record<string, any>) => Promise<any>;
  distinct: (data: Record<string, any>) => Promise<any>;
  trackPageview: () => Promise<any>;
  __VERSION: string;
}

declare global {
  interface Window {
    hardal?: HardalInstance;
    dataLayer?: any[];
  }
} 