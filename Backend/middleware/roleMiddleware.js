export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const normalizedAllowed = [...allowedRoles];
    if (allowedRoles.includes('blood_bank') && !allowedRoles.includes('bloodbank')) {
      normalizedAllowed.push('bloodbank');
    }
    if (allowedRoles.includes('bloodbank') && !allowedRoles.includes('blood_bank')) {
      normalizedAllowed.push('blood_bank');
    }

    // Support req.user (populated by authRoutes' verifyToken) or req.admin / req.bloodBank
    const userRole = req.user?.role || req.admin?.role || req.bloodBank?.role;

    if (!userRole) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};
