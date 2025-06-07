export const validateAuth = (requiredRole = null) => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return false;
    }

    // Check role if specified
    if (requiredRole && payload.role !== requiredRole) {
      const redirectUrl = payload.role === "admin" ? "/admin" : "/student";
      window.location.href = redirectUrl;
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("token");
    window.location.href = "/login";
    return false;
  }
};

export const getCurrentUser = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing stored user", error);
    }
  }

  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Role checking utility for components
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  return user && user.role === requiredRole;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
};
