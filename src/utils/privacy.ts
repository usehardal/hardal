export function redactPIIFromURL(urlString: string): string {
  try {
    let fullUrl: URL;
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

    // PII patterns
    const piiPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /(\+\d{1,3}[- ]?)?\d{3}[- ]?\d{3}[- ]?\d{4}/g,
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
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
        if (piiPatterns.some(pattern => 
          pattern.test(decodeURIComponent(key)) || 
          pattern.test(decodeURIComponent(value))
        )) {
          hasRedactedParams = true;
          break;
        }
      }

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