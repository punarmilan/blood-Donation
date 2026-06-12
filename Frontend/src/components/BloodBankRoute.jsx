import React from "react";
import { Navigate } from "react-router-dom";

const BloodBankRoute = ({ children }) => {
  const token = localStorage.getItem("bloodBankToken");

  if (!token) {
    return <Navigate to="/blood-bank/login" replace />;
  }

  return children;
};

export default BloodBankRoute;
