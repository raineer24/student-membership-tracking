import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard"; // Student's personal dashboard
import MembershipPage from "./pages/MembershipPage"; // Admin membership management
import DashboardPage from "./components/DashboardPage"; // Admin main dashboard
import ProtectedRoute from "./components/ProtectedRoute";

// Custom Redirect Component
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HomeRedirect:", { user, loading });
    if (loading) return;

    if (!user) {
      console.log("Redirecting to /login - no user");
      navigate("/login", { replace: true });
    } else if (user.role === "STUDENT") {
      console.log("Redirecting to /student-dashboard - student role");
      navigate("/student-dashboard", { replace: true });
    } else if (user.role === "ADMIN") {
      console.log("Redirecting to /admin-dashboard - admin role");
      navigate("/admin-dashboard", { replace: true });
    } else {
      console.log("Redirecting to /login - unexpected role:", user.role);
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  
  return null;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Student Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/memberships"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MembershipPage />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy route redirects for backward compatibility */}
        <Route
          path="/membership"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
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