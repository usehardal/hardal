// PII Redaction patterns
const piiPatterns = [
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone numbers - requiring actual separators
  /(\+\d{1,3}[- ]?)\d{3}[- ]\d{3}[- ]\d{4}/g,
  // Social security numbers
  /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
];

export function redactPIIFromURL(urlString: string, excludeSearch = false, excludeHash = false): string {
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

    // Redact PII from pathname
    let redactedPath = fullUrl.pathname;
    piiPatterns.forEach((pattern) => {
      redactedPath = redactedPath.replace(pattern, "(redacted)");
    });
    fullUrl.pathname = redactedPath;

    // Handle query parameters - only redact specific parameters containing PII
    if (fullUrl.search && !excludeSearch) {
      const params = new URLSearchParams(fullUrl.search);
      const redactedParams = new URLSearchParams();
      let hasModifiedParams = false;

      params.forEach((value: string, key: string) => {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value);

        // Check if key contains PII
        const keyHasPII = piiPatterns.some((pattern) => pattern.test(decodedKey));

        // Check if value contains PII
        const valueHasPII = piiPatterns.some((pattern) => pattern.test(decodedValue));

        if (keyHasPII) {
          redactedParams.append("(redacted)", value);
          hasModifiedParams = true;
        } else if (valueHasPII) {
          redactedParams.append(key, "(redacted)");
          hasModifiedParams = true;
        } else {
          redactedParams.append(key, value);
        }
      });

      if (hasModifiedParams) {
        fullUrl.search = redactedParams.toString();
      }
    }

    // Exclude hash if configured
    if (excludeHash) {
      fullUrl.hash = "";
    }

    return fullUrl.toString();
  } catch (error) {
    console.error("[Hardal] Error redacting PII from URL:", error);
    return urlString;
  }
} 