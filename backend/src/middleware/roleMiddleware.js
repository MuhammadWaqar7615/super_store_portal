const authorizeRoles = (...rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'User is not authorized to access this route',
      });
    }

    // Admin has full access to all routes
    if (req.user.role === 'Admin') {
      return next();
    }

    // Check if user's role matches
    if (rolesOrPermissions.includes(req.user.role)) {
      return next();
    }

    // Check if user has explicit permission granted in permissions array
    const userPermissions = req.user.permissions || [];
    const hasPermission = rolesOrPermissions.some(item => userPermissions.includes(item));
    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role '${req.user?.role || 'Customer'}' or permissions are not authorized to access this route`,
    });
  };
};

module.exports = { authorizeRoles };
