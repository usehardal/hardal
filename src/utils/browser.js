export function getBrowserInfo() {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return { browser: "unknown", version: "unknown" };
  }

  const ua = navigator.userAgent;
  let browser = "unknown";
  let version = "unknown";

  try {
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
  } catch (error) {
    console.warn("[Hardal] Error parsing browser info:", error);
  }

  return { browser, version };
}

export function getDeviceType() {
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