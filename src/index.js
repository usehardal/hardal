(function (w, d) {
  "use strict";

  // Create queue if it doesn't exist
  w.hardalQueue = w.hardalQueue || [];

  // Create stub functions before actual implementation loads
  var hardal = function () {
    hardal.q.push(arguments);
  };
  hardal.q = hardal.q || [];
  hardal.methods = ["init", "track", "trackPageview", "configure"];

  // Create stub methods
  hardal.methods.forEach(function (method) {
    hardal[method] = function () {
      hardal.q.push([method, ...Array.prototype.slice.call(arguments)]);
    };
  });

  // Assign to window
  w.hardal = hardal;
  // Add PII redaction utility functions
  // Add PII redaction utility functions
  function redactPIIFromURL(urlString) {
    try {
      let fullUrl;
      try {
        fullUrl = new URL(urlString);
      } catch (e) {
        if (urlString.startsWith("/")) {
          fullUrl = new URL(urlString, window.location.origin);
        } else if (!urlString.includes("://")) {
          const base = window.location.href.split("/").slice(0, -1).join("/");
          fullUrl = new URL(urlString, base);
        } else {
          return urlString;
        }
      }

      // Patterns for common PII in URLs
      const piiPatterns = [
        // Email addresses
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        // Phone numbers
        /(\+\d{1,3}[- ]?)?\d{3}[- ]?\d{3}[- ]?\d{4}/g,
        // Social security numbers
        /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
        // Credit card numbers
        /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
        // Names in URL
        // /\/users?\/[a-zA-Z]+[a-zA-Z0-9-_]+/g,
        // UUID/GUID
        //  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
        // Account or user IDs
        // /\/(?:user|account|profile)\/\d+/g
      ];

      // Redact PII from pathname
      let redactedPath = fullUrl.pathname;
      piiPatterns.forEach((pattern) => {
        redactedPath = redactedPath.replace(pattern, "(redacted)");
      });
      fullUrl.pathname = redactedPath;

      // Handle query parameters
      if (fullUrl.search) {
        const params = new URLSearchParams(fullUrl.search);
        let hasRedactedParams = false;

        for (const [key, value] of params.entries()) {
          const decodedKey = decodeURIComponent(key);
          const decodedValue = decodeURIComponent(value);

          // Check if key or value contains PII
          const hasPII = piiPatterns.some(
            (pattern) => pattern.test(decodedKey) || pattern.test(decodedValue)
          );

          if (hasPII) {
            hasRedactedParams = true;
            break;
          }
        }

        // If PII was found, simply use (redacted) instead of the full query string
        if (hasRedactedParams) {
          return `${fullUrl.origin}${fullUrl.pathname}?(redacted)`;
        }
      }

      return fullUrl.toString();
    } catch (error) {
      console.error("[Hardal] Error redacting PII from URL:", error);
      return urlString;
    }
  }

  function redactPIIFromQueryParams(params) {
    const redactedParams = {};
    const piiPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /(\+\d{1,3}[- ]?)?\d{3}[- ]?\d{3}[- ]?\d{4}/g,
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
    ];

    for (const [key, value] of Object.entries(params)) {
      let newKey = key;
      let newValue = value;

      // Check if key contains PII
      if (
        piiPatterns.some((pattern) => pattern.test(decodeURIComponent(key)))
      ) {
        newKey = "(redacted)";
      }

      // Check if value contains PII
      if (
        piiPatterns.some((pattern) => pattern.test(decodeURIComponent(value)))
      ) {
        newValue = "(redacted)";
      }

      redactedParams[newKey] = newValue;
    }

    return redactedParams;
  }

  // Helper function to safely get URL parts
  function safeGetUrlPart(url, partExtractor) {
    try {
      const urlObj = new URL(url);
      return partExtractor(urlObj);
    } catch (e) {
      return url;
    }
  }
  // Utility functions
  function formatDate(date) {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  function generateHashId() {
    return "hr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  function getDeviceType() {
    var ua = navigator.userAgent;
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

  function getBrowserInfo() {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
        return { browser: "unknown", version: "unknown" };
    }

    var ua = navigator.userAgent;
    var browser = "unknown";
    var version = "unknown";

    try {
        if (ua.includes("Firefox/")) {
            browser = "Firefox";
            version = ua.split("Firefox/")[1]?.split(" ")[0] || "unknown";
        } else if (ua.includes("Chrome/")) {
            browser = "Chrome";
            version = ua.split("Chrome/")[1]?.split(" ")[0] || "unknown";
        } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
            browser = "Safari";
            // More robust Safari version detection
            const versionMatch = ua.match(/Version\/(\d+\.\d+)/);
            version = versionMatch ? versionMatch[1] : "unknown";
        } else if (ua.includes("Edg/")) {
            browser = "Edge";
            version = ua.split("Edg/")[1]?.split(" ")[0] || "unknown";
        }
    } catch (error) {
        console.warn("[Hardal] Error parsing browser info:", error);
    }

    return { browser, version };
  }

  function getAllQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return redactPIIFromQueryParams(params);
  }

  // Event Queue implementation
  const EventQueue = {
    queue: [],
    processing: false,
    add: function (event) {
      return new Promise((resolve, reject) => {
        this.queue.push({ event, resolve, reject });
        if (!this.processing) {
          this.process();
        }
      });
    },
    process: async function () {
      if (this.processing || this.queue.length === 0) return;
      this.processing = true;
      while (this.queue.length > 0) {
        const { event, resolve, reject } = this.queue.shift();
        try {
          const result = await event();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
      this.processing = false;
    },
  };

  // Main implementation
  function initHardal(options) {
    var config = {
      endpoint: "",
      options: {
        autoPageview: true,
        fetchFromGA4: false,
        fetchFromFBPixel: false,
        fetchFromRTB: false,
        fetchFromDataLayer: false,
        ...options,
      },
    };

    // Get endpoint from hardalConfig
    if (w.hardalConfig && w.hardalConfig.endpoint) {
      config.endpoint = w.hardalConfig.endpoint;
    }

    if (!config.endpoint) {
      console.error("[Hardal] No endpoint provided in configuration");
      return;
    }

    // Network request capture mechanism
    function initNetworkCapture() {
      let eventBuffer = [];
      const BATCH_SIZE = 10;
      const FLUSH_INTERVAL = 2000;

      async function processNetworkRequest(entry) {
        try {
          const serverDistinctId = await generateServerDistinctId()
          const url = new URL(entry.name);

          // GA4 Tracking
          if (
            config.options.fetchFromGA4 &&
            (url.pathname.includes("/g/collect") ||
              url.pathname.includes("/collect?v=2"))
          ) {
            const queryParams = {};
            url.searchParams.forEach((value, key) => {
              queryParams[key] = value;
            });

            eventBuffer.push({
              event_name: queryParams.en || "event",
              client_id: queryParams.cid || queryParams._cid,
              source: "ga4",
              server_distinct_id: serverDistinctId,
              event_name: queryParams.en || "event",
              client_id: queryParams.cid || queryParams._cid,
              session_id: queryParams.sid,
              page_location: redactPIIFromURL(queryParams.dl || ""),
              page_referrer: redactPIIFromURL(queryParams.dr || ""),
              consent_state: queryParams.gcs,
              timestamp: new Date().toISOString(),
              original_url: url,
              query_params: queryParams,
            });
          }

          // Facebook Pixel Tracking
          if (
            config.options.fetchFromFBPixel &&
            (
              // Standard Facebook-specific endpoints
              (url.hostname === "www.facebook.com" && url.pathname.includes("/tr/")) ||
              (url.hostname === "connect.facebook.net") ||
              (url.hostname === "graph.facebook.com") ||
              // Check for Facebook-specific parameters
              url.searchParams.has("fb_pixel_id") ||
              url.searchParams.has("fbp") ||
              url.searchParams.has("fbc") ||
              url.searchParams.has("fbci") ||
              url.searchParams.has("fbclid") ||
              url.searchParams.has("fb_source") ||
              url.searchParams.has("fb_action_ids") ||
              url.searchParams.has("fb_action_types") ||
              url.searchParams.has("fb_ref")
            )
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
              original_url: url,
              query_params: queryParams,
            });
          }

          if (eventBuffer.length >= BATCH_SIZE) {
            flushEvents();
          }
        } catch (error) {
          console.error("[Hardal] Error processing network request:", error);
        }
      }

      async function flushEvents() {
        if (eventBuffer.length === 0) return;

        const events = [...eventBuffer];
        eventBuffer = [];

        try {
          w.hardal.track("network_batch", {
            events: events,
            batch_size: events.length,
            batch_timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("[Hardal] Failed to send batch events:", error);
          eventBuffer = [...events, ...eventBuffer];
        }
      }

      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(processNetworkRequest);
        });
        observer.observe({ entryTypes: ["resource"] });
      } catch (e) {
        console.error("[Hardal] PerformanceObserver error:", e);
      }

      setInterval(flushEvents, FLUSH_INTERVAL);
      window.addEventListener("beforeunload", flushEvents);
    }

    // Initialize network capture if any tracking option is enabled
    if (
      config.options.fetchFromGA4 ||
      config.options.fetchFromFBPixel ||
      config.options.fetchFromRTB
    ) {
      initNetworkCapture();
    }

    async function generateServerDistinctId() {
      try {
        // Get basic device info without screen resolution for privacy
        const colorDepth = window.screen.colorDepth;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;
        
        // Get WebGL info for additional entropy
        let webGLRenderer = "unknown";
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl");
          if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              webGLRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
          }
        } catch (e) {
          console.warn("[Hardal] WebGL info collection failed:", e);
        }

        // Create initial client-side hash
        const deviceString = `${colorDepth}|${timezone}|${language}|${platform}|${webGLRenderer}`;
        const msgBuffer = new TextEncoder().encode(deviceString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const clientHash = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Return temporary client hash - will be enhanced with IP on server
        return `hr_tmp_${clientHash.slice(0, 32)}`;
      } catch (error) {
        console.error("[Hardal] Error generating client hash:", error);
        return generateHashId(); // Fallback to existing method
      }
    }

    async function getBaseEventData() {
      var browserInfo = getBrowserInfo();

      // Replace the hardcoded sessionDistinctId with the new generated one
      const serverDistinctId = await generateServerDistinctId();

      return {
        distinct: {
          server_distinct_id: serverDistinctId,
        },
        page: {
          url: redactPIIFromURL(w.location.href),
          path: redactPIIFromURL(w.location.pathname),
          title: d.title,
          protocol: w.location.protocol,
          hostname: w.location.hostname,
          hash: w.location.hash,
          referrer: d.referrer ? redactPIIFromURL(d.referrer) : "",
        },
        screen: {
          resolution: w.screen.width + "x" + w.screen.height,
          color_depth: w.screen.colorDepth,
          pixel_depth: w.screen.pixelDepth,
          viewport_size: w.innerWidth + "x" + w.innerHeight,
          device_pixel_ratio: w.devicePixelRatio,
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

    // Modify helper function to get dataLayer state
    function getCurrentDataLayerState() {
      try {
        if (!window.dataLayer || !config.options.fetchFromDataLayer) {
          return null;
        }

        // Remove duplicates by converting to string for comparison
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

    // Modify trackEvent to include dataLayer state
    async function trackEvent(eventName, properties = {}) {
      const baseEventData = await getBaseEventData();
      
      // Add dataLayer state if feature is enabled
      const dataLayerState = getCurrentDataLayerState();
      const dataLayerProperties = dataLayerState ? { dataLayer: dataLayerState } : {};

      const eventData = {
        event_name: eventName,
        properties: {
          ...baseEventData,
          ...properties,
          ...dataLayerProperties,  // Include dataLayer state in all events
        },
        created_at: formatDate(new Date()),
      };

      const sendEvent = async () => {
        try {
          const endpointWithPath = config.endpoint + "/push/hardal";
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

      return EventQueue.add(() => sendEvent());
    }

    function initializeTracking() {
      if (config.options.autoPageview) {
        setTimeout(() => trackEvent("page_view"), 0);
      }

      var originalPushState = w.history.pushState;
      w.history.pushState = function () {
        originalPushState.apply(this, arguments);
        if (config.options.autoPageview) {
          trackEvent("page_view");
        }
      };

      w.addEventListener("popstate", () => {
        if (config.options.autoPageview) {
          trackEvent("page_view");
        }
      });
    }

    // Replace stubs with real implementations
    w.hardal = {
      init: initHardal,
      track: (eventName, properties) => {
        trackEvent(eventName, properties).catch((error) => {
          console.error(
            `[Hardal] Failed to track event "${eventName}":`,
            error
          );
        });
      },
      trackPageview: async () => {
        try {
          const result = await trackEvent("page_view");
          return result;
        } catch (error) {
          console.error("[Hardal] Failed to track pageview:", error);
          throw error;
        }
      },
      configure: (newOptions) => {
        config.options = {
          ...config.options,
          ...newOptions,
        };
      },
    };

    // Process queued commands
    var queued = hardal.q || [];
    queued.forEach(function (args) {
      var method = args[0];
      var params = args.slice(1);
      if (w.hardal[method]) {
        w.hardal[method].apply(null, params);
      }
    });

    initializeTracking();
  }

  hardal.__VERSION = "1.2.0";

  // Initialize if config exists
  if (w.hardalConfig) {
    initHardal(w.hardalConfig.options);
  }
})(window, document);