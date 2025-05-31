// client/src/App.jsx

import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MembershipPage from "./pages/MembershipPage";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ Custom Redirect Component
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  if (user.role === "STUDENT") {
    navigate("/membership", { replace: true });
    return null;
  }

  return <div>Redirecting...</div>;
};

// ✅ Main App Component
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={<ProtectedRoute allowedRoles={["STUDENT"]} />}
        >
          <Route path="/membership" element={<MembershipPage />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;