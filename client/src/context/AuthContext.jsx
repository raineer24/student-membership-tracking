import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          console.log("Using stored user data:", JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Fetch user error:", err.response?.status, err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
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
      
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      
      const normalizedUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      };
      
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      
      console.log("Login user:", normalizedUser);
      
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.status, err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};