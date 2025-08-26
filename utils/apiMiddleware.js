// Line 1-25: Create shared middleware for all API routes
// utils/apiMiddleware.js - Centralized API handling

import jwt from 'jsonwebtoken';
import prisma from './db.js';

// Line 5-15: Authentication middleware with role-based access
export function withAuth(handler, requiredRole = null) {
  return async (req, res) => {
    try {
      // Extract and verify JWT token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication required" 
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Line 20-25: Role validation (SOLID: Single Responsibility)
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ 
          success: false, 
          error: "Unauthorized access" 
        });
      }

      // Attach user to request
      req.user = decoded;
      return handler(req, res);

    } catch (error) {
      return handleError(res, error);
    }
  };
}

// Line 35-55: Centralized error handling (DRY Principle)
export function handleError(res, error) {
  console.error("API Error:", error);

  // Prisma-specific errors
  if (error.code?.startsWith('P')) {
    const prismaErrors = {
      'P2002': { status: 409, message: "Duplicate entry conflict" },
      'P2025': { status: 404, message: "Record not found" },
      'P2003': { status: 400, message: "Foreign key constraint failed" }
    };
    
    const prismaError = prismaErrors[error.code];
    if (prismaError) {
      return res.status(prismaError.status).json({
        success: false,
        error: prismaError.message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid token" 
    });
  }

  // Default server error
  return res.status(500).json({ 
    success: false, 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// Line 65-85: Route method handler (KISS Principle)
export function createRouteHandler(handlers) {
  return withAuth(async (req, res) => {
    const method = req.method;
    const handler = handlers[method];
    
    if (!handler) {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
        allowedMethods: Object.keys(handlers)
      });
    }

    return handler(req, res);
  });
}

// Line 90-110: Simplified API route pattern
export function createAdminHandler(handlers) {
  return withAuth(createRouteHandler(handlers), 'admin');
}

// Line 115-125: Response standardization
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

export function sendError(res, message, status = 400, details = null) {
  return res.status(status).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  });
}