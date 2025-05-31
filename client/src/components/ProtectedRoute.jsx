import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute check:", { user, loading, allowedRoles });

  if (loading) {
    console.log("ProtectedRoute: Still loading");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log("ProtectedRoute: Role not allowed, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;