// App.jsx

import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import MembershipPage from "./pages/MembershipPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Redirect root `/` to `/membership` if logged in */}
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route path="/membership" element={<MembershipPage />} />
          </Route>

          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Custom redirect component
const HomeRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/membership" replace />;
};

export default App;