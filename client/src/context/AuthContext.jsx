// Line 1: Fixed import with explicit useContext import to prevent bundler conflicts
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Line 5: Create authentication context
const AuthContext = createContext();

// Line 8: AuthProvider component with descriptive variable names to prevent minification conflicts
export const AuthProvider = ({ children }) => {
  // Line 10: State management with descriptive variable names
  const [currentUser, setCurrentUser] = useState(null);
  const [authenticationToken, setAuthenticationToken] = useState(localStorage.getItem("token"));
  const [isAuthenticationLoading, setIsAuthenticationLoading] = useState(true);

  // Line 15: useEffect for authentication initialization
  useEffect(() => {
    const initializeUserAuthentication = async () => {
      // Line 18: Early return if no authentication token
      if (!authenticationToken) {
        setIsAuthenticationLoading(false);
        return;
      }

      try {
        // Line 24: Skip API call and rely on stored user data
        const storedUserData = localStorage.getItem("user");
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setCurrentUser(parsedUserData);
          console.log("Using stored user data:", parsedUserData);
        }
      } catch (authenticationError) {
        // Line 31: Handle authentication errors
        console.error("Fetch user error:", authenticationError.response?.status, authenticationError.message);
        if (authenticationError.response?.status === 401) {
          // Line 33: Clear invalid authentication data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthenticationToken(null);
          setCurrentUser(null);
        }
      } finally {
        // Line 40: Always set loading to false
        setIsAuthenticationLoading(false);
      }
    };

    // Line 44: Execute authentication initialization
    initializeUserAuthentication();
  }, [authenticationToken]); // Dependency on authentication token

  // Line 48: Login function with descriptive naming
  const performUserLogin = async (userEmail, userPassword) => {
    try {
      console.log("Attempting login with:", { email: userEmail });
      
      // Line 52: API call for authentication
      const loginResponse = await axios.post("/api/auth/login", { 
        email: userEmail, 
        password: userPassword 
      });
      
      // Line 57: Extract authentication data
      const { accessToken, user: authenticatedUser } = loginResponse.data;
      
      // Line 60: Store authentication token
      localStorage.setItem("token", accessToken);
      setAuthenticationToken(accessToken);
      
      // Line 64: Normalize user object from login
      const normalizedUserProfile = {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        studentId: authenticatedUser.studentId,
      };
      
      // Line 72: Store user data in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(normalizedUserProfile));
      setCurrentUser(normalizedUserProfile);
      
      console.log("Login user:", normalizedUserProfile);
      
      return true;
    } catch (loginError) {
      // Line 80: Handle login errors
      console.error("Login error:", loginError.response?.status, loginError.message);
      throw loginError;
    }
  };

  // Line 85: Logout function with cleanup
  const performUserLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthenticationToken(null);
    setCurrentUser(null);
    setIsAuthenticationLoading(false);
  };

  // Line 93: Context value object with descriptive property names
  const authenticationContextValue = {
    user: currentUser,
    token: authenticationToken,
    loading: isAuthenticationLoading,
    login: performUserLogin,
    logout: performUserLogout
  };

  // Line 101: Return provider with context value
  return (
    <AuthContext.Provider value={authenticationContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Line 108: Custom hook with FIXED useContext import reference
export const useAuth = () => {
  // Line 110: Use explicit useContext import instead of React.useContext
  const authenticationContext = useContext(AuthContext);
  
  // Line 113: Validate context usage
  if (!authenticationContext) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  
  return authenticationContext;
};