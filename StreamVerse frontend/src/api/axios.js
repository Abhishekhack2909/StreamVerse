import axios from "axios";
import { supabase } from "../lib/supabase";

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout for file uploads
});

// Request interceptor to add Supabase auth token
API.interceptors.request.use(
  async (config) => {
    // Get current session from Supabase if available
    if (supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (e) {
        console.error("Error getting session:", e);
      }
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && supabase) {
      try {
        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !session) {
          // Redirect to login if refresh fails
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return API(error.config);
      } catch (e) {
        console.error("Error refreshing session:", e);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
