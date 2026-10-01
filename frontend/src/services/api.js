import axios from "axios";

const getBaseURL = () => {
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

export default api;