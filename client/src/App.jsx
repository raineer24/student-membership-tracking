// app.jsx

import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MembershipPage from "./pages/MembershipPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Custom Redirect Component
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HomeRedirect:", { user, loading });
    if (loading) return;

    if (!user) {
      console.log("Redirecting to /login");
      navigate("/login", { replace: true });
    } else if (user.role === "STUDENT") {
      console.log("Redirecting to /membership");
      navigate("/membership", { replace: true });
    } else if (user.role === "ADMIN") {
      console.log("Redirecting to /dashboard");
      navigate("/dashboard", { replace: true });
    } else {
      console.log("Redirecting to /login (unexpected role)");
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  return null;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/membership"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <MembershipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;