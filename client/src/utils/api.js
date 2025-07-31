// client/src/utils/api.js
// Lines 1-80: Enhanced API utility with centralized auth expiration handling
import axios from "axios";

const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes("localhost");

// Line 5-10: Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: isLocalhost ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Line 12-25: Request interceptor - adds auth headers automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Line 27-60: Response interceptor - handles all auth expiration scenarios
apiClient.interceptors.response.use(
  (response) => {
    // Successful responses pass through unchanged
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    // Line 35-45: Handle different error scenarios
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth data and redirect
          console.warn("Authentication expired, redirecting to login");
          clearAuthData();
          redirectToLogin();
          break;
          
        case 404:
          // 404 from protected endpoints may indicate expired session
          if (isProtectedEndpoint(config.url)) {
            console.warn("404 from protected endpoint, possible auth expiration");
            // Don't auto-logout on 404 - let component decide
          }
          break;
          
        case 403:
          // Forbidden - user doesn't have required permissions
          console.warn("Access forbidden:", response.data?.message || "Insufficient permissions");
          break;
          
        default:
          // Other HTTP errors - log but don't clear auth
          console.error(`API Error ${response.status}:`, response.data?.message || error.message);
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Line 58-60: Network errors - graceful fallback without logout
      console.error("Network error - check connection:", error.message);
    }
    
    return Promise.reject(error);
  }
);

// Line 62-70: Helper functions for auth management
function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function redirectToLogin() {
  // Prevent infinite redirects
  if (window.location.pathname !== '/login') {
    window.location.href = "/login";
  }
}

// Line 72-80: Utility to identify protected endpoints
function isProtectedEndpoint(url) {
  const protectedPaths = ['/students/me', '/memberships/me', '/dashboard', '/admin'];
  return protectedPaths.some(path => url?.includes(path));
}

export default apiClient;