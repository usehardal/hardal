import { HardalConfig, BaseEventData } from './types';
import { EventQueue } from './EventQueue';
import { redactPIIFromURL } from './utils/privacy';
// Import other utilities...

class Hardal {
  private config: HardalConfig;
  private eventQueue: EventQueue;
  private initialized: boolean = false;

  constructor(config: HardalConfig) {
    this.config = {
      autoPageview: true,
      fetchFromGA4: false,
      fetchFromFBPixel: false,
      fetchFromRTB: false,
      fetchFromDataLayer: false,
      ...config
    };

    if (!this.config.endpoint) {
      throw new Error("[Hardal] No endpoint provided in configuration");
    }

    this.eventQueue = new EventQueue();
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;
    
    if (
      this.config.fetchFromGA4 ||
      this.config.fetchFromFBPixel ||
      this.config.fetchFromRTB
    ) {
      this.initNetworkCapture();
    }

    if (this.config.autoPageview) {
      setTimeout(() => this.track("page_view"), 0);
    }

    this.initializeHistoryTracking();
    this.initialized = true;
  }

  private initNetworkCapture(): void {
    let eventBuffer: any[] = [];
    const BATCH_SIZE = 10;
    const FLUSH_INTERVAL = 2000;

    const processNetworkRequest = async (entry: PerformanceResourceTiming) => {
      try {
        const serverDistinctId = await this.generateServerDistinctId();
        const url = new URL(entry.name);

        // GA4 Tracking
        if (
          this.config.fetchFromGA4 &&
          (url.pathname.includes("/g/collect") || url.pathname.includes("/collect?v=2"))
        ) {
          // Process GA4 events...
        }

        // Facebook Pixel Tracking
        if (
          this.config.fetchFromFBPixel &&
          this.isFacebookPixelRequest(url)
        ) {
          // Process Facebook events...
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
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            processNetworkRequest(entry as PerformanceResourceTiming);
          }
        });
      });
      observer.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.error("[Hardal] PerformanceObserver error:", e);
    }

    setInterval(() => this.flushEvents(eventBuffer), FLUSH_INTERVAL);
    window.addEventListener("beforeunload", () => this.flushEvents(eventBuffer));
  }

  private initializeHistoryTracking(): void {
    const originalPushState = window.history.pushState;
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      if (this.config.autoPageview) {
        this.track("page_view");
      }
    };

    window.addEventListener("popstate", () => {
      if (this.config.autoPageview) {
        this.track("page_view");
      }
    });
  }

  private async generateServerDistinctId(): Promise<string> {
    try {
      const colorDepth = window.screen.colorDepth;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      const platform = navigator.platform;
      
      const deviceString = `${colorDepth}|${timezone}|${language}|${platform}`;
      const msgBuffer = new TextEncoder().encode(deviceString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const clientHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return `hr_tmp_${clientHash.slice(0, 32)}`;
    } catch (error) {
      console.error("[Hardal] Error generating client hash:", error);
      return `hr_tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async getBaseEventData(): Promise<BaseEventData> {
    const serverDistinctId = await this.generateServerDistinctId();

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
        name: this.getBrowserInfo().name,
        version: this.getBrowserInfo().version,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        user_agent: navigator.userAgent,
      },
      device_type: this.getDeviceType(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      query_params: this.getAllQueryParams(),
    };
  }

  private getBrowserInfo(): { name: string; version: string } {
    const ua = navigator.userAgent;
    let browser = "unknown";
    let version = "unknown";

    if (ua.includes("Firefox/")) {
      browser = "Firefox";
      version = ua.split("Firefox/")[1]?.split(" ")[0] || "unknown";
    } else if (ua.includes("Chrome/")) {
      browser = "Chrome";
      version = ua.split("Chrome/")[1]?.split(" ")[0] || "unknown";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
      browser = "Safari";
      const versionMatch = ua.match(/Version\/(\d+\.\d+)/);
      version = versionMatch ? versionMatch[1] : "unknown";
    } else if (ua.includes("Edg/")) {
      browser = "Edge";
      version = ua.split("Edg/")[1]?.split(" ")[0] || "unknown";
    }

    return { name: browser, version };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  private getAllQueryParams(): Record<string, any> {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  private async sendEvent(eventData: any): Promise<any> {
    const response = await fetch(`${this.config.endpoint}/push/hardal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private isFacebookPixelRequest(url: URL): boolean {
    return (
      (url.hostname === "www.facebook.com" && url.pathname.includes("/tr/")) ||
      url.hostname === "connect.facebook.net" ||
      url.hostname === "graph.facebook.com" ||
      url.searchParams.has("fb_pixel_id") ||
      url.searchParams.has("fbp") ||
      url.searchParams.has("fbc") ||
      url.searchParams.has("fbci") ||
      url.searchParams.has("fbclid") ||
      url.searchParams.has("fb_source") ||
      url.searchParams.has("fb_action_ids") ||
      url.searchParams.has("fb_action_types") ||
      url.searchParams.has("fb_ref")
    );
  }

  private async flushEvents(eventBuffer: any[]): Promise<void> {
    if (eventBuffer.length === 0) return;

    try {
      await this.track("network_batch", {
        events: eventBuffer,
        batch_size: eventBuffer.length,
        batch_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Hardal] Failed to send batch events:", error);
    }
  }

  public async track(eventName: string, properties: Record<string, any> = {}): Promise<any> {
    try {
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
        created_at: this.formatDate(new Date()),
      };

      return this.eventQueue.add(() => this.sendEvent(eventData));
    } catch (error) {
      console.error(`[Hardal] Failed to track event "${eventName}":`, error);
      throw error;
    }
  }

  private getCurrentDataLayerState(): any[] | null {
    try {
      if (!window.dataLayer || !this.config.fetchFromDataLayer) {
        return null;
      }

      return window.dataLayer.filter((item, index, self) => 
        index === self.findIndex((t) => 
          JSON.stringify(t) === JSON.stringify(item)
        )
      );
    } catch (error) {
      console.warn('[Hardal] Error getting dataLayer state:', error);
      return null;
    }
  }

  public trackPageview(): Promise<any> {
    return this.track("page_view");
  }

  public configure(newOptions: Partial<HardalConfig>): void {
    this.config = {
      ...this.config,
      ...newOptions,
    };
  }

  // ... (keep all the helper methods like getBaseEventData, redactPIIFromURL, etc.)
  // Convert them to private class methods
}

export default Hardal; 