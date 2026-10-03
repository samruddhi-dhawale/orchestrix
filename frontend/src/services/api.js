import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname.includes("onrender.com")) {
    return "https://orchestrix-api.onrender.com/api";
  }
  return "http://localhost:8080/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor: attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    try {
      const rawUser = localStorage.getItem("orchestrix_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-redirect on 401 Unauthorized for protected APIs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config && error.config.url && error.config.url.includes("/auth/login");
      if (!isLoginRequest) {
        localStorage.removeItem("orchestrix_user");
        if (typeof window !== "undefined" && window.location.hash !== "#/login") {
          window.location.hash = "#/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;