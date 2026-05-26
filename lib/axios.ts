import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // Check if we are running locally or on a local area network (LAN) IP
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    if (isLocal) {
      return `${protocol}//${hostname}:8000/api`;
    }
  }
  return "https://nammafit-backend-django.onrender.com/api";
};

export const BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: refresh on 401 ────────────────────────────────────
// IMPORTANT: Skip refresh logic for the login/token endpoint itself.
// A 401 on /token/ means wrong credentials — not an expired token.
const AUTH_ENDPOINTS = ["/token/", "/token/refresh/"];

const isAuthEndpoint = (url?: string) =>
  AUTH_ENDPOINTS.some((ep) => url?.includes(ep));

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Skip refresh for auth endpoints (login / token refresh) ──────────────
    // A 401 here means wrong credentials, not an expired token.
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    // ── Network / no-response errors — just reject, don't redirect ────────────
    if (!error.response) {
      return Promise.reject(error);
    }

    // ── Only attempt refresh once per request ─────────────────────────────────
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

      if (!refreshToken) {
        // No refresh token — session expired, force logout
        processQueue(error, null);
        isRefreshing = false;
        if (typeof window !== "undefined") {
          localStorage.clear();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess: string = data.access;
        localStorage.setItem("access_token", newAccess);
        processQueue(null, newAccess);
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        if (typeof window !== "undefined") {
          localStorage.clear();
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
