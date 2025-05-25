import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const ProtectedRoute = ({}) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading )return <div>Loading...</div>;

  if (!user) {
    return <Navigate to='/login' state={{ from: location}} replace/>;
  }

  return Children;
};
export default ProtectedRoute;
