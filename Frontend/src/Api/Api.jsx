
import axios from "axios";
import * as siteConfig from "../Config/Config";

// ✅ Create Axios Instance
const Api = axios.create({
  baseURL: siteConfig.default.apiBaseURL,
  timeout: siteConfig.default.apiTimeout || 5000,
});

const authEndpoints = ["login/", "send-otp/", "verify-otp/", "token/refresh/"];
const isAuthUrl = (url) => {
  if (!url) return false;
  return authEndpoints.some((endpoint) => url.includes(endpoint));
};

// ✅ Attach Access Token to Requests
Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && !isAuthUrl(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Function to Refresh Token
const refreshToken = async () => {
  const refresh_token = localStorage.getItem("refresh_token");
  if (refresh_token) {
    try {
      const response = await axios.post(
        `${siteConfig.default.apiBaseURL}token/refresh/`,
        { refresh: refresh_token }
      );
      const newAccessToken = response.data.access;
      localStorage.setItem("access_token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.warn("Refresh token expired or invalid.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }
  return null;
};

// ✅ Auto Retry Failed Request on 401 Unauthorized for authenticated endpoints
Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // For login or OTP endpoints, let the calling component handle the error directly
    if (isAuthUrl(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return Api(originalRequest); // 🔁 Retry original request
      }
    }

    return Promise.reject(error);
  }
);

export default Api;
