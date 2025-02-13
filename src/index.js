import { EventQueue } from './utils/queue';
import { getBrowserInfo, getDeviceType } from './utils/browser';
import { redactPIIFromURL, redactPIIFromQueryParams, getAllQueryParams } from './utils/url';
import { generateServerDistinctId, formatDate } from './utils/device';

class HardalAnalytics {
  constructor(config = {}) {
    this.config = {
      endpoint: '',
      options: {
        autoPageview: true,
        fetchFromGA4: false,
        fetchFromFBPixel: false,
        fetchFromRTB: false,
        fetchFromDataLayer: false,
        ...config.options
      }
    };

    if (config.endpoint) {
      this.config.endpoint = config.endpoint;
    }

    this.eventQueue = new EventQueue();
    this.VERSION = "1.2.0";
  }

  init(config) {
    this.config = {
      ...this.config,
      ...config
    };
    
    if (!this.config.endpoint) {
      console.error("[Hardal] No endpoint provided in configuration");
      return;
    }

    if (this.config.options.autoPageview) {
      this.initializeTracking();
    }

    if (
      this.config.options.fetchFromGA4 ||
      this.config.options.fetchFromFBPixel ||
      this.config.options.fetchFromRTB
    ) {
      this.initNetworkCapture();
    }
  }

  initNetworkCapture() {
    let eventBuffer = [];
    const BATCH_SIZE = 10;
    const FLUSH_INTERVAL = 2000;

    const processNetworkRequest = async (entry) => {
      try {
        const serverDistinctId = await generateServerDistinctId();
        const url = new URL(entry.name);

        // GA4 Tracking
        if (
          this.config.options.fetchFromGA4 &&
          (url.pathname.includes("/g/collect") ||
            url.pathname.includes("/collect?v=2"))
        ) {
          const queryParams = {};
          url.searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });

          eventBuffer.push({
            event_name: queryParams.en || "event",
            source: "ga4",
            server_distinct_id: serverDistinctId,
            client_id: queryParams.cid || queryParams._cid,
            session_id: queryParams.sid,
            page_location: redactPIIFromURL(queryParams.dl || ""),
            page_referrer: redactPIIFromURL(queryParams.dr || ""),
            consent_state: queryParams.gcs,
            timestamp: new Date().toISOString(),
            original_url: url.toString(),
            query_params: queryParams,
          });
        }

        // Facebook Pixel Tracking
        if (
          this.config.options.fetchFromFBPixel &&
          this.isFacebookPixelRequest(url)
        ) {
          const queryParams = {};
          url.searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });

          eventBuffer.push({
            source: "facebook",
            server_distinct_id: serverDistinctId,
            event_name: queryParams.ev,
            pixel_id: queryParams.id || queryParams.fb_pixel_id,
            page_url: redactPIIFromURL(queryParams.dl || ""),
            referrer: redactPIIFromURL(queryParams.rl || ""),
            fbp: queryParams.fbp,
            timestamp: queryParams.ts || new Date().toISOString(),
            original_url: url.toString(),
            query_params: queryParams,
          });
        }

        if (eventBuffer.length >= BATCH_SIZE) {
          this.flushEvents(eventBuffer);
          eventBuffer = [];
        }
      } catch (error) {
        console.error("[Hardal] Error processing network request:", error);
      }
    };

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(processNetworkRequest);
      });
      observer.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.error("[Hardal] PerformanceObserver error:", e);
    }

    setInterval(() => this.flushEvents(eventBuffer), FLUSH_INTERVAL);
    window.addEventListener("beforeunload", () => this.flushEvents(eventBuffer));
  }

  isFacebookPixelRequest(url) {
    return (
      (url.hostname === "www.facebook.com" && url.pathname.includes("/tr/")) ||
      url.hostname === "connect.facebook.net" ||
      url.hostname === "graph.facebook.com" ||
      url.searchParams.has("fb_pixel_id") ||
      url.searchParams.has("fbp") ||
      url.searchParams.has("fbc") ||
      url.searchParams.has("fbclid")
    );
  }

  async flushEvents(events) {
    if (!events || events.length === 0) return;

    try {
      await this.track("network_batch", {
        events: events,
        batch_size: events.length,
        batch_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Hardal] Failed to send batch events:", error);
    }
  }

  getCurrentDataLayerState() {
    try {
      if (!window.dataLayer || !this.config.options.fetchFromDataLayer) {
        return null;
      }

      const uniqueDataLayer = window.dataLayer.filter((item, index, self) => 
        index === self.findIndex((t) => 
          JSON.stringify(t) === JSON.stringify(item)
        )
      );

      return uniqueDataLayer;
    } catch (error) {
      console.warn('[Hardal] Error getting dataLayer state:', error);
      return null;
    }
  }

  async getBaseEventData() {
    const browserInfo = getBrowserInfo();
    const serverDistinctId = await generateServerDistinctId();

    return {
      distinct: {
        server_distinct_id: serverDistinctId,
      },
      page: {
        url: redactPIIFromURL(window.location.href),
        path: redactPIIFromURL(window.location.pathname),
        title: document.title,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        hash: window.location.hash,
        referrer: document.referrer ? redactPIIFromURL(document.referrer) : "",
      },
      screen: {
        resolution: `${window.screen.width}x${window.screen.height}`,
        color_depth: window.screen.colorDepth,
        pixel_depth: window.screen.pixelDepth,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        device_pixel_ratio: window.devicePixelRatio,
      },
      browser: {
        name: browserInfo.browser,
        version: browserInfo.version,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        user_agent: navigator.userAgent,
      },
      device_type: getDeviceType(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      query_params: getAllQueryParams(),
    };
  }

  async track(eventName, properties = {}) {
    const baseEventData = await this.getBaseEventData();
    const dataLayerState = this.getCurrentDataLayerState();
    const dataLayerProperties = dataLayerState ? { dataLayer: dataLayerState } : {};

    const eventData = {
      event_name: eventName,
      properties: {
        ...baseEventData,
        ...properties,
        ...dataLayerProperties,
      },
      created_at: formatDate(new Date()),
    };

    const sendEvent = async () => {
      try {
        const endpointWithPath = this.config.endpoint + "/push/hardal";
        const response = await fetch(endpointWithPath, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          eventName,
          timestamp: new Date().toISOString(),
          result,
        };
      } catch (error) {
        console.error("[Hardal] Error sending event:", error);
        return Promise.reject({
          success: false,
          eventName,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    };

    return this.eventQueue.add(() => sendEvent());
  }

  async trackPageview() {
    try {
      return await this.track("page_view");
    } catch (error) {
      console.error("[Hardal] Failed to track pageview:", error);
      throw error;
    }
  }

  configure(newOptions) {
    this.config.options = {
      ...this.config.options,
      ...newOptions,
    };
  }

  initializeTracking() {
    if (this.config.options.autoPageview) {
      setTimeout(() => this.trackPageview(), 0);
    }

    const originalPushState = window.history.pushState;
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      if (this.config.options.autoPageview) {
        this.trackPageview();
      }
    };

    window.addEventListener("popstate", () => {
      if (this.config.options.autoPageview) {
        this.trackPageview();
      }
    });
  }
}

// Create singleton instance
const hardal = new HardalAnalytics();

// For backwards compatibility with script tag usage
if (typeof window !== 'undefined') {
  window.hardal = hardal;
  
  // Initialize if config exists
  if (window.hardalConfig) {
    hardal.init(window.hardalConfig);
  }
}

export default hardal; 