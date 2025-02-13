export function redactPIIFromURL(urlString) {
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

    const piiPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /(\+\d{1,3}[- ]?)?\d{3}[- ]?\d{3}[- ]?\d{4}/g,
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    ];

    let redactedPath = fullUrl.pathname;
    piiPatterns.forEach((pattern) => {
      redactedPath = redactedPath.replace(pattern, "(redacted)");
    });
    fullUrl.pathname = redactedPath;

    if (fullUrl.search) {
      const params = new URLSearchParams(fullUrl.search);
      let hasRedactedParams = false;

      for (const [key, value] of params.entries()) {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value);

        const hasPII = piiPatterns.some(
          (pattern) => pattern.test(decodedKey) || pattern.test(decodedValue)
        );

        if (hasPII) {
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

export function redactPIIFromQueryParams(params) {
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

    if (piiPatterns.some((pattern) => pattern.test(decodeURIComponent(key)))) {
      newKey = "(redacted)";
    }

    if (piiPatterns.some((pattern) => pattern.test(decodeURIComponent(value)))) {
      newValue = "(redacted)";
    }

    redactedParams[newKey] = newValue;
  }

  return redactedParams;
}

export function getAllQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};
  urlParams.forEach((value, key) => {
    params[key] = value;
  });
  return redactPIIFromQueryParams(params);
} 