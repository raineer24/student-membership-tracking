import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import MembershipPage from "./pages/MembershipPage";
import DashboardPage from "./components/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useToast, ToastProvider } from "./hooks/useToast.jsx";
import SimpleToast from "./components/SimpleToast";
import Register from './pages/Register.jsx';

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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return null;
};

const AppContent = () => {
  const { toast, hideToast } = useToast();
  
  console.log("AppContent render - toast state:", toast);
  console.log("AppContent render - toast exists?", !!toast);
  
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/register" element={<Register />}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

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

      {/* ENHANCED: Toast rendering with debugging */}
      {toast && (
        <>
          {console.log("Rendering toast:", toast)}
          <SimpleToast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </>
      )}
    </div>
  );
};

// ENHANCED: Wrap with ToastProvider
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;