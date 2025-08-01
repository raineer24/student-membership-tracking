// client/src/utils/api.js - CORRECTED VERSION
// Lines 1-120: Complete auth interceptor with working expiration handling
import axios from "axios";

const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes("localhost");

// Line 5-15: Create axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: isLocalhost ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
  timeout: 15000, // 15 second timeout for production
});

// Line 17-35: Request interceptor - adds auth headers automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Auth header added to request:", config.url);
    } else {
      console.warn("⚠️ No token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Line 37-90: Response interceptor - handles all auth expiration scenarios
apiClient.interceptors.response.use(
  (response) => {
    // Successful responses pass through unchanged
    console.log("✅ API Success:", response.config.url, response.status);
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    console.error("❌ API Error:", config?.url, response?.status, error.message);
    
    // Line 47-85: Handle different error scenarios
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth data and redirect IMMEDIATELY
          console.warn("🚨 401 UNAUTHORIZED - Authentication expired!");
          console.warn("🧹 Clearing auth data and redirecting to login...");
          
          // Clear auth data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          
          // Add delay to ensure localStorage is cleared
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              console.warn("🔄 Redirecting to login page...");
              window.location.href = "/login";
            }
          }, 100);
          
          break;
          
        case 403:
          // Forbidden - user doesn't have required permissions
          console.warn("🚫 403 FORBIDDEN - Access denied:", response.data?.message || "Insufficient permissions");
          
          // If it's a role-based access issue, might need re-authentication
          if (response.data?.message?.includes("Admin") || response.data?.message?.includes("Student")) {
            console.warn("🔄 Role-based access denied - checking auth...");
            
            // Check if token is still valid but role is wrong
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp && payload.exp < Date.now() / 1000;
                
                if (isExpired) {
                  console.warn("🚨 Token expired during role check - clearing auth");
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }
              } catch (tokenError) {
                console.error("🚨 Invalid token format - clearing auth");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }
            }
          }
          break;
          
        case 404:
          // 404 from protected endpoints may indicate expired session
          if (isProtectedEndpoint(config?.url)) {
            console.warn("🔍 404 from protected endpoint:", config?.url);
            console.warn("💭 Could indicate auth expiration, but not auto-logging out");
          }
          break;
          
        case 500:
          // Server errors - don't clear auth, but log for debugging
          console.error("🔥 500 SERVER ERROR:", config?.url);
          console.error("📋 Error details:", response.data);
          break;
          
        default:
          // Other HTTP errors - log but don't clear auth
          console.error(`🌐 API Error ${response.status}:`, response.data?.message || error.message);
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Timeout errors
      console.error("⏰ Request timeout:", config?.url);
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Network errors - graceful fallback without logout
      console.error("🌐 Network error - check connection:", error.message);
    } else {
      console.error("❓ Unknown error:", error);
    }
    
    return Promise.reject(error);
  }
);

// Line 92-110: Enhanced auth validation function (NO EXPORT HERE)
const validateAuthState = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    console.warn("🚨 No token found - redirecting to login");
    window.location.href = "/login";
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && payload.exp < Date.now() / 1000;
    
    if (isExpired) {
      console.warn("🚨 Token expired - clearing auth and redirecting");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return false;
    }
    
    console.log("✅ Auth state valid:", payload.role, payload.email);
    return true;
  } catch (error) {
    console.error("🚨 Invalid token - clearing auth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return false;
  }
};

// Line 112-120: Utility functions
function isProtectedEndpoint(url) {
  if (!url) return false;
  const protectedPaths = ['/students/me', '/memberships/me', '/dashboard', '/admin', '/students', '/payments'];
  return protectedPaths.some(path => url.includes(path));
}

// SINGLE EXPORT SECTION - No duplicates
export default apiClient;
export { validateAuthState };