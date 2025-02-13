export async function generateServerDistinctId() {
  try {
    const colorDepth = window.screen.colorDepth;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    
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

    const deviceString = `${colorDepth}|${timezone}|${language}|${platform}|${webGLRenderer}`;
    const msgBuffer = new TextEncoder().encode(deviceString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const clientHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `hr_tmp_${clientHash.slice(0, 32)}`;
  } catch (error) {
    console.error("[Hardal] Error generating client hash:", error);
    return `hr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function formatDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
} 