// Determine base URL: production domain (vaivahikmanch.in), current browser origin, or local dev port 8000
export const getBaseURL = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/+$/, "") + "/";
  }
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const { hostname, port, origin } = window.location;
    // Local development React dev server (e.g. port 3000/3001) -> point to local Django port 8000
    if ((hostname === "localhost" || hostname === "127.0.0.1") && port && port !== "80" && port !== "8000") {
      return `http://${hostname}:8000/`;
    }
    // In production or when served by Django (vaivahikmanch.in or EC2 IP), use window origin
    return origin.replace(/\/+$/, "") + "/";
  }
  return "https://vaivahikmanch.in/";
};

export const baseURL = getBaseURL();

// AWS S3 Media Bucket Base URL
export const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";

/**
 * Universal Media URL Resolver:
 * Maps any relative path, legacy localhost URL, or media folder path directly to S3.
 */
export const getMediaUrl = (path, fallback = "") => {
  if (!path) return fallback;
  if (typeof path !== "string") return fallback;
  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // Data URLs or SVG inlines
  if (trimmed.startsWith("data:")) return trimmed;

  // Legacy localhost/127.0.0.1 media URLs -> rewrite to S3
  const localMatch = trimmed.match(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/(?:media\/)?(.*)$/i);
  if (localMatch && localMatch[1]) {
    return `${S3_MEDIA_BASE_URL}${localMatch[1].replace(/^\/+/, "")}`;
  }

  // If already an absolute HTTP/HTTPS URL (including S3 or CDN)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Relative path or legacy /media/... prefix -> map cleanly to S3
  const cleanPath = trimmed.replace(/^\/+/, "").replace(/^media\//, "");
  return `${S3_MEDIA_BASE_URL}${cleanPath}`;
};

const config = {
  baseURL,
  apiBaseURL: `${baseURL}`,   // Backend url (base url)
  staticBaseURL: `${baseURL}static/`,
  s3BaseURL: S3_MEDIA_BASE_URL,
  apiTimeout: 60000,
  getMediaUrl,
};

export default config;
