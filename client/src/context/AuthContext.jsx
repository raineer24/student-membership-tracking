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
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Normalize user object to ensure role is at top level
        const student = res.data;
        setUser({
          id: student.userId || student.id,
          email: student.email,
          role: student.user?.role || "STUDENT", // Extract role from nested user
          studentId: student.id,
          name: student.name,
        });
        console.log("Normalized user:", {
          id: student.userId || student.id,
          email: student.email,
          role: student.user?.role || "STUDENT",
          studentId: student.id,
          name: student.name,
        });
      } catch (err) {
        console.error("Fetch user error:", err.response?.status, err.message);
        if (err.response?.status === 401) {
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
      const res = await axios.post("/api/auth/login", { email, password });
      const { accessToken, user } = res.data;
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      // Normalize user object from login
      setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      });
      console.log("Login user:", {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      });
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.status, err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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