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
        // Use different endpoints based on user role stored in token or make a generic /me endpoint
        // For now, let's try to get user info from a generic endpoint
        let res;
        
        try {
          // Try the students endpoint first (for students)
          res = await axios.get("/api/students/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const student = res.data;
          setUser({
            id: student.userId || student.id,
            email: student.email,
            role: student.user?.role || "STUDENT",
            studentId: student.id,
            name: student.name,
          });
        } catch (studentErr) {
          if (studentErr.response?.status === 404) {
            // If students/me fails, try a generic user endpoint for admins
            try {
              res = await axios.get("/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              const user = res.data;
              setUser({
                id: user.id,
                email: user.email,
                role: user.role,
                studentId: user.studentId || null,
                name: user.name,
              });
            } catch (authErr) {
              throw studentErr; // Throw the original error if both fail
            }
          } else {
            throw studentErr;
          }
        }
        
        console.log("Fetched user:", user);
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
      console.log("Attempting login with:", { email });
      const res = await axios.post("/api/auth/login", { email, password });
      const { accessToken, user } = res.data;
      
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      
      // Normalize user object from login
      const normalizedUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      };
      
      setUser(normalizedUser);
      console.log("Login user:", normalizedUser);
      console.log("Login successful, navigating to", user.role === 'ADMIN' ? '/dashboard' : '/membership');
      
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.status, err.message);
      throw err;
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