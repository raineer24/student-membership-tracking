// pages/api/utils/auth.js

const jwt = require('jsonwebtoken');

function authenticate(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Authentication required');
  return jwt.verify(token, process.env.JWT_SECRET);
}

function authorizeRole(requiredRole, user) {
  if (user.role !== requiredRole) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

module.exports = {
  authenticate,
  authorizeRole,
};