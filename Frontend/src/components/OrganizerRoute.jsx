import React from 'react';
import { Navigate } from 'react-router-dom';

const OrganizerRoute = ({ children }) => {
  const token = localStorage.getItem('organizer-token');
  let user = {};
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage", error);
  }

  if (!token || user.role !== 'organizer') {
    return <Navigate to="/organizer-login" replace />;
  }

  return children;
};

export default OrganizerRoute;
