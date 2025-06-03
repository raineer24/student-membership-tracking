// pages/api/utils/auth.js
const jwt = require('jsonwebtoken');

function authenticate(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function authorizeRole(requiredRole, user) {
  if (user.role !== requiredRole) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

// New function to support multiple allowed roles
function authorizeRoles(allowedRoles, user) {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
  }
}

// Middleware function to wrap API handlers with auth
function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      const user = authenticate(req);
      
      if (options.allowedRoles) {
        authorizeRoles(options.allowedRoles, user);
      }
      
      // Add user to request object
      req.user = user;
      
      return await handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.message === 'Authentication required' || error.message === 'Invalid token') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (error.message.startsWith('Forbidden')) {
        return res.status(403).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {
  authenticate,
  authorizeRole,
  authorizeRoles,
  withAuth,
};