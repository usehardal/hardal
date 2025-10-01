import { HardalConfig, BasePayload, TrackEventPayload } from './types';
import { EventQueue } from './EventQueue';
import { redactPIIFromURL } from './utils/privacy';

class Hardal {
  private config: HardalConfig;
  private eventQueue: EventQueue;
  private initialized: boolean = false;
  private currentUrl: string = '';
  private currentRef: string = '';
  private cache?: string;
  private disabled: boolean = false;
  private readonly VERSION = '3.0.0';
  private readonly eventNameAttribute = 'data-hardal-event';
  private readonly eventRegex = /data-hardal-event-([\w-_]+)/;
  private readonly delayDuration = 300;

  // Store event handlers for cleanup
  private readonly cleanupHandlers: Array<() => void> = [];

  constructor(config: HardalConfig) {
    this.config = {
      autoTrack: true,
      doNotTrack: false,
      excludeSearch: false,
      excludeHash: false,
      domains: [],
      ...config,
    };

    if (!this.config.website) {
      throw new Error('[Hardal] No website ID provided in configuration');
    }

    this.eventQueue = new EventQueue();
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }
    
    // Set current URL and referrer
    this.currentUrl = redactPIIFromURL(
      window.location.href,
      this.config.excludeSearch,
      this.config.excludeHash
    );
    this.currentRef =
      document.referrer.startsWith(window.location.origin)
        ? ''
        : redactPIIFromURL(document.referrer, this.config.excludeSearch, this.config.excludeHash);

    // Only setup click tracking (not auto pageviews in React)
    if (!this.trackingDisabled()) {
      this.handleClicks();
    }
    
    // Only for vanilla JS apps: track pageviews and history changes
    if (this.config.autoTrack && !this.trackingDisabled()) {
      this.handlePathChanges();
      this.handleTitleChanges();
      
      // Track initial pageview asynchronously
      queueMicrotask(() => {
        this.track().catch((error) => {
          console.warn('[Hardal] Initial pageview tracking failed:', error);
        });
      });
    }

    this.initialized = true;
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserInfo(): { browser: string; version: string } {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return { browser: 'unknown', version: 'unknown' };
    }

    const ua = navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';

    try {
      if (ua.includes('Firefox/')) {
        browser = 'Firefox';
        version = ua.split('Firefox/')[1]?.split(' ')[0] || 'unknown';
      } else if (ua.includes('Chrome/')) {
        browser = 'Chrome';
        version = ua.split('Chrome/')[1]?.split(' ')[0] || 'unknown';
      } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
        browser = 'Safari';
        const versionMatch = ua.match(/Version\/(\d+\.\d+)/);
        version = versionMatch ? versionMatch[1] : 'unknown';
      } else if (ua.includes('Edg/')) {
        browser = 'Edge';
        version = ua.split('Edg/')[1]?.split(' ')[0] || 'unknown';
      }
    } catch (error) {
      console.warn('[Hardal] Error parsing browser info:', error);
    }

    return { browser, version };
  }

  private async generateDistinctId(): Promise<string> {
    try {
      const deviceString = `${window.screen.colorDepth}|${
        Intl.DateTimeFormat().resolvedOptions().timeZone
      }|${navigator.language}|${navigator.platform}`;
      const msgBuffer = new TextEncoder().encode(deviceString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const clientHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `hr_${clientHash.slice(0, 32)}`;
    } catch (error) {
      console.error('[Hardal] Error generating client hash:', error);
      return `hr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async getPayload(): Promise<BasePayload> {
    const browserInfo = this.getBrowserInfo();
    const distinctId = await this.generateDistinctId();

    return {
      website: this.config.website,
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
        title: document.title,
        hostname: window.location.hostname,
      url: this.currentUrl,
      referrer: this.currentRef,
      distinct_id: distinctId,
      device_type: this.getDeviceType(),
      browser_name: browserInfo.browser,
      browser_version: browserInfo.version,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      device_pixel_ratio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      created_at: new Date(),
      timestamp: Date.now(),
    };
  }

  private hasDoNotTrack(): boolean {
    const dntValue =
      (navigator as any).doNotTrack ||
      (window as any).doNotTrack ||
      (navigator as any).msDoNotTrack;
    return dntValue === 1 || dntValue === '1' || dntValue === 'yes';
  }

  private trackingDisabled(): boolean {
    const { domains, doNotTrack } = this.config;
    return (
      this.disabled ||
      !this.config.website ||
      (localStorage && localStorage.getItem('hardal.disabled') === 'true') ||
      (domains && domains.length > 0 && !domains.includes(window.location.hostname)) ||
      (doNotTrack === true && this.hasDoNotTrack())
    );
  }

  private handlePush = (state: any, title: string, url?: string): void => {
    if (!url) return;

    this.currentRef = this.currentUrl;
    let newUrl = new URL(url, window.location.href);

    if (this.config.excludeSearch) {
      newUrl.search = '';
    }
    if (this.config.excludeHash) {
      newUrl.hash = '';
    }

    this.currentUrl = redactPIIFromURL(
      newUrl.toString(),
      this.config.excludeSearch,
      this.config.excludeHash
    );

    if (this.currentUrl !== this.currentRef) {
      setTimeout(() => this.track(), this.delayDuration);
    }
  };

  private handlePathChanges(): void {
    // Store original methods before modifying
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const self = this;
    
    window.history.pushState = function (state: any, title: string, url?: string | URL | null) {
      const urlStr = url ? (typeof url === 'string' ? url : url.toString()) : undefined;
      self.handlePush(state, title, urlStr);
      return originalPushState.call(window.history, state, title, url);
    };

    window.history.replaceState = function (state: any, title: string, url?: string | URL | null) {
      const urlStr = url ? (typeof url === 'string' ? url : url.toString()) : undefined;
      self.handlePush(state, title, urlStr);
      return originalReplaceState.call(window.history, state, title, url);
    };

    // Store cleanup
    this.cleanupHandlers.push(() => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    });
  }

  private handleTitleChanges(): void {
    const node = document.querySelector('head > title');
    if (!node) return;

    const observer = new MutationObserver(([entry]) => {
      if (entry && entry.target) {
        document.title = (entry.target as HTMLElement).textContent || document.title;
      }
    });

    observer.observe(node, {
      subtree: true,
      characterData: true,
      childList: true,
    });

    // Store cleanup
    this.cleanupHandlers.push(() => observer.disconnect());
  }

  private handleClicks(): void {
    const clickHandler = async (e: MouseEvent): Promise<void> => {
      const isSpecialTag = (tagName: string) => ['BUTTON', 'A'].includes(tagName);

      const trackElement = async (el: Element): Promise<any> => {
        const eventName = el.getAttribute(this.eventNameAttribute);
        if (eventName) {
          const eventData: Record<string, any> = {};
          el.getAttributeNames().forEach((name) => {
            const match = name.match(this.eventRegex);
            if (match) {
              eventData[match[1]] = el.getAttribute(name);
            }
          });
          return this.track(eventName, eventData);
        }
      };

      const findParentTag = (rootElem: Element, maxSearchDepth: number): Element | null => {
        let currentElement: Element | null = rootElem;
        for (let i = 0; i < maxSearchDepth; i++) {
          if (currentElement && isSpecialTag(currentElement.tagName)) {
            return currentElement;
          }
          currentElement = currentElement?.parentElement || null;
          if (!currentElement) {
            return null;
          }
        }
        return null;
      };

      const el = e.target as Element;
      const parentElement = isSpecialTag(el.tagName) ? el : findParentTag(el, 10);

      if (parentElement) {
        const href = parentElement.getAttribute('href');
        const target = parentElement.getAttribute('target');
        const eventName = parentElement.getAttribute(this.eventNameAttribute);

        if (eventName) {
          if (parentElement.tagName === 'A') {
            const external =
              target === '_blank' ||
              e.ctrlKey ||
              e.shiftKey ||
              e.metaKey ||
              (e.button && e.button === 1);

            if (eventName && href) {
              if (!external) {
                e.preventDefault();
              }
              return trackElement(parentElement).then(() => {
                if (!external) {
                  const targetWindow = target === '_top' ? window.top : window;
                  if (targetWindow) {
                    targetWindow.location.href = href;
                  }
                }
              });
            }
          } else if (parentElement.tagName === 'BUTTON') {
            return trackElement(parentElement);
          }
        }
      } else {
        return trackElement(el);
      }
    };

    document.addEventListener('click', clickHandler, true);

    // Store cleanup
    this.cleanupHandlers.push(() => {
      document.removeEventListener('click', clickHandler, true);
    });
  }

  private safeJSONStringify(obj: any): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      // Handle DOM nodes
      if (value instanceof Node) return '[DOM Node]';
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  private async send(payload: any, type = 'event'): Promise<any> {
    if (this.trackingDisabled()) {
      return;
    }

    const hostUrl = this.config.hostUrl || '';
    
    // Validate hostUrl before sending
    if (!hostUrl || !hostUrl.startsWith('http')) {
      console.warn('[Hardal] No valid hostUrl configured. Events will not be sent. Please provide hostUrl in config.');
      return Promise.resolve();
    }
    
    const endpoint = `${hostUrl.replace(/\/$/, '')}/push/hardal`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof this.cache !== 'undefined') {
      headers['x-hardal-cache'] = this.cache;
    }

    const requestBody = {
      type,
      payload,
      event_name: payload.name || 'page_view',
    };

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(endpoint, {
        method: 'POST',
        body: this.safeJSONStringify(requestBody),
        headers,
        credentials: 'omit',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (data) {
        this.disabled = !!data.disabled;
        this.cache = data.cache;
      }

      return data;
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        console.error('[Hardal] Request timeout - server not responding');
      } else {
        console.error('[Hardal] Error sending event:', e);
      }
    }
  }

  public async track(
    obj?: string | Record<string, any> | ((payload: BasePayload) => any),
    data?: Record<string, any>
  ): Promise<any> {
    const basePayload = await this.getPayload();

    if (typeof obj === 'string') {
      return this.send({
        ...basePayload,
        name: obj,
        data: typeof data === 'object' ? data : undefined,
      });
    } else if (typeof obj === 'object') {
      return this.send(obj);
    } else if (typeof obj === 'function') {
      return this.send(obj(basePayload));
    }

    return this.send(basePayload);
  }

  public async distinct(data: Record<string, any>): Promise<any> {
    const payload = {
      ...(await this.getPayload()),
      data,
      name: 'identify',
    };
    return this.send(payload, 'identify');
  }

  public async trackPageview(): Promise<any> {
    return this.track('page_view');
  }

  public getVersion(): string {
    return this.VERSION;
  }

  // Cleanup method to prevent memory leaks
  public destroy(): void {
    this.cleanupHandlers.forEach((cleanup) => {
      try {
        cleanup();
      } catch (e) {
        console.error('[Hardal] Error during cleanup:', e);
      }
    });
    this.cleanupHandlers.length = 0;
    this.initialized = false;
  }
}

export default Hardal; 
