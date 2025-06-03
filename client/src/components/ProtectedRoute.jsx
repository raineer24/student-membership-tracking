import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute check:", { 
    user, 
    loading, 
    allowedRoles, 
    currentPath: location.pathname,
    userRole: user?.role 
  });

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

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role;
  console.log("ProtectedRoute: Checking role:", { userRole, allowedRoles, includes: allowedRoles?.includes(userRole) });
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`ProtectedRoute: Role ${userRole} not allowed for ${location.pathname}, allowed roles:`, allowedRoles);
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute: Access granted for", userRole, "to", location.pathname);
  return children;
};

export default ProtectedRoute;