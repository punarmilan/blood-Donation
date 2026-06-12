import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E74C3C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === "donor") {
      return <Navigate to="/donor/dashboard" replace />;
    }

    if (currentUser.role === "recipient") {
      return <Navigate to="/recipient/profile" replace />;
    }

    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentUser.role === "bloodBank") {
      return <Navigate to="/blood-bank/profile" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
