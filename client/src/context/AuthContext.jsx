import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        console.log("No token found, setting loading to false");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching user with token:", token);
        const res = await axios.get("/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User fetched:", res.data);
        setUser(res.data);
      } catch (err) {
        console.error("Fetch user error:", err.response?.status, err.message);
        if (err.response?.status === 401) {
          console.log("401 error, clearing token");
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log("Attempting login with:", { email });
      const res = await axios.post("/api/auth/login", { email, password });
      const { accessToken, user } = res.data;
      console.log("Login response:", { accessToken, user });
      localStorage.setItem("token", accessToken);
      console.log("Token saved to localStorage:", localStorage.getItem("token"));
      setToken(accessToken);
      setUser(user);
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.status, err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("Logging out, clearing token");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};