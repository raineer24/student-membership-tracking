// client/src/utils/auth.js  
// Lines 1-150: Enhanced auth utilities with comprehensive token management
import apiClient from './api';

// Line 5-35: Enhanced token validation with detailed logging
export const validateAuth = (requiredRole = null) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No token found, redirecting to login");
    window.location.href = "/login";
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    // Check if token is expired with buffer time
    if (payload.exp && payload.exp < currentTime) {
      console.warn("Token expired, clearing auth data");
      clearAuthData();
      window.location.href = "/login";
      return false;
    }

    // Check role if specified
    if (requiredRole && payload.role !== requiredRole) {
      console.warn(`Access denied: required ${requiredRole}, user has ${payload.role}`);
      const redirectUrl = payload.role === "admin" ? "/admin" : "/student";
      window.location.href = redirectUrl;
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error.message);
    clearAuthData();
    window.location.href = "/login";
    return false;
  }
};

// Line 37-55: Get current user with fallback strategies
export const getCurrentUser = () => {
  // Strategy 1: Try stored user data first (faster)
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // Validate user object has required fields
      if (user.id && user.email && user.role) {
        return user;
      }
    } catch (error) {
      console.error("Error parsing stored user:", error.message);
    }
  }

  // Strategy 2: Decode from token (fallback)
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId
    };
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
};

// Line 57-65: Get auth headers for manual API calls
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    console.warn("No token available for auth headers");
    return { "Content-Type": "application/json" };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Line 67-75: Role checking utility for components
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  if (!user || !user.role) {
    return false;
  }
  
  return user.role === requiredRole;
};

// Line 77-90: Check if user is authenticated without side effects
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    
    // Include 30-second buffer to prevent edge cases
    return payload.exp && payload.exp > (currentTime + 30);
  } catch (error) {
    console.error("Error checking authentication:", error.message);
    return false;
  }
};

// Line 92-100: Clear all authentication data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); 
  localStorage.removeItem("refreshToken"); // Future proofing
  
  console.info("Authentication data cleared");
};

// Line 102-120: Token refresh utility (future implementation)
export const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    console.warn("No refresh token available");
    return false;
  }

  try {
    const response = await apiClient.post("/auth/refresh", {
      refreshToken: refreshToken
    });

    const { accessToken, user } = response.data;
    
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    
    console.info("Token refreshed successfully");
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error.message);
    clearAuthData();
    return false;
  }
};

// Line 122-135: Utility to check token expiration time
export const getTokenExpirationTime = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch (error) {
    console.error("Error getting token expiration:", error.message);
    return null;
  }
};

// Line 137-150: Utility to get time until token expires
export const getTimeUntilExpiration = () => {
  const expirationTime = getTokenExpirationTime();
  if (!expirationTime) return null;

  const currentTime = new Date();
  const timeUntilExpiration = expirationTime.getTime() - currentTime.getTime();
  
  return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
};