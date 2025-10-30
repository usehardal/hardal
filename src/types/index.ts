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

// Event payload for 'event' type tracking
export interface EventPayload {
  signal?: string;
  website?: string;
  name?: string;
  browser_name?: string;
  browser_version?: string;
  os_version?: string;
  device_pixel_ratio?: number;
  device_type: string; // Required for event
  hostname?: string;
  language?: string;
  platform?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url: string; // Required for event
  viewport_width?: string;
  timestamp: number; // Required for event
  url_path?: string;
  test?: boolean;
  data?: any;
}

// Identify payload for 'identify' type tracking
export interface IdentifyPayload {
  signal?: string;
  website?: string;
  data?: any;
  name?: string;
  browser_name?: string;
  browser_version?: string;
  os_version?: string;
  device_pixel_ratio?: number;
  device_type?: string;
  hostname?: string;
  language?: string;
  platform?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url?: string;
  viewport_width?: string;
  timestamp?: number;
  url_path?: string;
  test?: boolean;
}

// Legacy type for backward compatibility
export interface BasePayload extends EventPayload {}

export interface TrackEventPayload extends EventPayload {
  name: string;
  data?: Record<string, any>;
}

export interface HardalInstance {
  track: (eventName?: string | Record<string, any> | ((payload: EventPayload) => any), data?: Record<string, any>) => Promise<any>;
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