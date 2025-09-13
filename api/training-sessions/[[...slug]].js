// File: api/training-sessions/[[...slug]].js
// Lines 1-250: Training Sessions API following existing database connection pattern

import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Lines 5-13: CORS headers - Following established pattern
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Lines 14-17: Authentication using working pattern
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Lines 19-28: Route handling using URL parsing - Consistent with existing APIs
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    const parts = pathname.split("/").filter(Boolean);
    const trainingIndex = parts.indexOf("training-sessions");
    const pathParts = trainingIndex !== -1 ? parts.slice(trainingIndex + 1) : [];
    
    console.log("🥋 Training Sessions API");
    console.log("REQ.URL:", req.url);
    console.log("PATH PARTS:", pathParts);
    console.log("METHOD:", req.method);

    // Lines 30-40: Route handling based on method
    if (req.method === 'POST') {
      return await handlePost(req, res, pathParts);
    } else if (req.method === 'GET') {
      return await handleGet(req, res, pathParts);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res, pathParts);
    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Training Sessions API Error:', error);
    
    // Lines 48-60: Enhanced error handling - Following existing pattern
    if (error.message === "Authentication required") {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }
    
    if (error.message === "Unauthorized") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized: Admin access required" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lines 65-120: POST endpoints - Create training session
async function handlePost(req, res, pathParts) {
  try {
    // POST /api/training-sessions - Log new training session
    if (pathParts.length === 0) {
      const {
        studentId,
        sessionType = 'Weekend',
        dayOfWeek,
        timeSlot = '10:00am-11:30am',
        date,
        attendance = 'Present',
        notes = '',
        duration = 90
      } = req.body;

      // Validate required fields
      if (!studentId || !dayOfWeek || !date) {
        return res.status(400).json({
          success: false,
          error: 'Student ID, day of week, and date are required'
        });
      }

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: parseInt(studentId) }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // Create training session
      const trainingSession = await prisma.trainingSession.create({
        data: {
          studentId: parseInt(studentId),
          sessionType,
          dayOfWeek,
          timeSlot,
          date: new Date(date),
          attendance,
          notes,
          duration: parseInt(duration)
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Training session logged successfully',
        data: trainingSession
      });
    }

    // Route not found
    return res.status(404).json({
      success: false,
      message: 'Training session endpoint not found'
    });

  } catch (error) {
    console.error('Training Session POST Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lines 125-200: GET endpoints - Retrieve training sessions and analytics
async function handleGet(req, res, pathParts) {
  try {
    // GET /api/training-sessions - List training sessions
    if (pathParts.length === 0) {
      const { studentId, limit = 50, sessionType, startDate, endDate } = req.query;

      let whereClause = {};

      // Filter by student if provided
      if (studentId) {
        whereClause.studentId = parseInt(studentId);
      }

      // Filter by session type if provided
      if (sessionType) {
        whereClause.sessionType = sessionType;
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.date.lte = new Date(endDate);
        }
      }

      const trainingSessions = await prisma.trainingSession.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: parseInt(limit)
      });

      return res.status(200).json({
        success: true,
        data: trainingSessions,
        count: trainingSessions.length
      });
    }

    // GET /api/training-sessions/analytics - Training analytics
    if (pathParts.length === 1 && pathParts[0] === "analytics") {
      // Get all students with their latest training session
      const studentsWithTraining = await prisma.student.findMany({
        include: {
          trainingSessions: {
            orderBy: { date: 'desc' },
            take: 1
          },
          memberships: {
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });

      const analytics = {
        totalStudents: studentsWithTraining.length,
        newStudents: 0,
        activeTraining: 0,
        missed2Weeks: 0,
        missed3Weeks: 0,
        inactive30Days: 0,
        noTrainingData: 0,
        revenueAtRisk: 0
      };

      const today = new Date();

      studentsWithTraining.forEach(student => {
        const latestSession = student.trainingSessions[0];
        const latestMembership = student.memberships[0];
        const isActiveMember = latestMembership && new Date(latestMembership.endDate) > today;
        const monthlyRate = student.monthlyRate || 1400;

        if (!latestSession) {
          analytics.noTrainingData++;
          if (isActiveMember) {
            analytics.revenueAtRisk += monthlyRate;
          }
          return;
        }

        const daysSinceTraining = Math.ceil((today - new Date(latestSession.date)) / (1000 * 60 * 60 * 24));
        const totalSessions = student.trainingSessions.length;

        // Categorize students based on training patterns
        if (totalSessions <= 2) {
          analytics.newStudents++;
        } else if (daysSinceTraining > 30) {
          analytics.inactive30Days++;
          if (isActiveMember) {
            analytics.revenueAtRisk += monthlyRate;
          }
        } else if (daysSinceTraining > 21) {
          analytics.missed3Weeks++;
          if (isActiveMember) {
            analytics.revenueAtRisk += monthlyRate * 0.5; // Partial risk
          }
        } else if (daysSinceTraining > 14) {
          analytics.missed2Weeks++;
        } else {
          analytics.activeTraining++;
        }
      });

      return res.status(200).json({
        success: true,
        data: analytics
      });
    }

    // Route not found
    return res.status(404).json({
      success: false,
      message: 'Training session endpoint not found'
    });

  } catch (error) {
    console.error('Training Session GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve training sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lines 205-240: DELETE endpoints - Remove training session
async function handleDelete(req, res, pathParts) {
  try {
    // DELETE /api/training-sessions/[id] - Remove incorrect entry
    if (pathParts.length === 1) {
      const sessionId = pathParts[0];

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      const deletedSession = await prisma.trainingSession.delete({
        where: { id: parseInt(sessionId) }
      });

      return res.status(200).json({
        success: true,
        message: 'Training session deleted successfully',
        data: deletedSession
      });
    }

    // Route not found
    return res.status(404).json({
      success: false,
      message: 'Training session endpoint not found'
    });

  } catch (error) {
    console.error('Training Session DELETE Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Training session not found'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}