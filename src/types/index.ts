export interface HardalConfig {
  endpoint: string;
  autoPageview?: boolean;
  fetchFromGA4?: boolean;
  fetchFromFBPixel?: boolean;
  fetchFromRTB?: boolean;
  fetchFromDataLayer?: boolean;
}

export interface EventQueueItem {
  event: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface BaseEventData {
  distinct: {
    server_distinct_id: string;
  };
  page: {
    url: string;
    path: string;
    title: string;
    protocol: string;
    hostname: string;
    hash: string;
    referrer: string;
  };
  screen: {
    resolution: string;
    color_depth: number;
    pixel_depth: number;
    viewport_size: string;
    device_pixel_ratio: number;
  };
  browser: {
    name: string;
    version: string;
    language: string;
    platform: string;
    vendor: string;
    user_agent: string;
  };
  device_type: string;
  timezone: string;
  timestamp: string;
  query_params: Record<string, any>;
}

declare global {
  interface Window {
    dataLayer?: any[];
  }
} 