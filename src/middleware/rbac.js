/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on the user's role.
 * Admins have full access and can perform all operations.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = authorize;

