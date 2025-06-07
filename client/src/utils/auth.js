export const validateAuth = (requiredRole = null) => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return false;
  }

  try {
    const payload = json.parse(atob(token.split(".")[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("token");
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
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parsejson.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};
