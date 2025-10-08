// File: api/training-sessions/[[...slug]].js
// ENHANCED: Added duplicate prevention in handlePost function
// Lines modified: 200-250 (rest unchanged)

import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let user;
    try {
      user = await authenticate(req);
      await authorizeRole("ADMIN", user);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed',
        error: authError.message 
      });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    const parts = pathname.split("/").filter(Boolean);
    const sessionsIndex = parts.indexOf("training-sessions");
    const pathParts = sessionsIndex !== -1 ? parts.slice(sessionsIndex + 1) : [];
    
    console.log("🥋 Training Sessions API");
    console.log("METHOD:", req.method);
    console.log("PATH PARTS:", pathParts);
    console.log("USER:", user.email);

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, pathParts);
      case 'POST':
        return await handlePost(req, res, pathParts, user.id);
      case 'PUT':
        return await handlePut(req, res, pathParts, user.id);
      case 'DELETE':
        return await handleDelete(req, res, pathParts);
      default:
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('❌ Training Sessions API Error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry - session may already exist for this date and student'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

async function handleGet(req, res, pathParts) {
  try {
    console.log("📖 GET Training Sessions - Path parts:", pathParts);

    if (pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      const sessionId = Number(pathParts[0]);
      
      const session = await prisma.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
          student: {
            select: { 
              id: true, 
              name: true, 
              email: true, 
              phone: true,
              monthlyRate: true,
              isLegacyStudent: true 
            }
          },
          creator: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: session
      });
    } 

    if (pathParts.length === 0) {
      const { 
        studentId, 
        startDate, 
        endDate, 
        sessionType,
        page = 1,
        limit = 50
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = {};
      
      if (studentId && !isNaN(parseInt(studentId))) {
        whereClause.studentId = parseInt(studentId);
      }
      
      if (startDate && endDate) {
        whereClause.sessionDate = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      } else if (startDate) {
        whereClause.sessionDate = { gte: new Date(startDate) };
      } else if (endDate) {
        whereClause.sessionDate = { lte: new Date(endDate) };
      }
      
      if (sessionType && ['WEEKEND', 'WEEKDAY', 'TRIAL', 'MAKEUP'].includes(sessionType)) {
        whereClause.sessionType = sessionType;
      }

      const [sessions, total] = await Promise.all([
        prisma.trainingSession.findMany({
          where: whereClause,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                monthlyRate: true,
                isLegacyStudent: true
              }
            },
            creator: {
              select: { id: true, email: true, name: true }
            }
          },
          orderBy: { sessionDate: 'desc' },
          skip: offset,
          take: parseInt(limit)
        }),
        prisma.trainingSession.count({ where: whereClause })
      ]);

      console.log(`📖 Found ${sessions.length} sessions out of ${total} total`);

      return res.status(200).json({
        success: true,
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } 

    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });

  } catch (error) {
    console.error('❌ Training Sessions GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch training sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

// ENHANCED: Added duplicate detection (Lines 200-280)
async function handlePost(req, res, pathParts, userId) {
  try {
    if (pathParts.length !== 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const {
      studentId,
      sessionType = 'WEEKEND',
      sessionDate,
      notes,
      attendanceStatus = 'PRESENT'
    } = req.body;

    console.log('📝 Creating training session:', {
      studentId, sessionType, sessionDate, attendanceStatus, userId
    });

    if (!studentId || !sessionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, sessionDate'
      });
    }

    const studentIdNum = parseInt(studentId);
    if (isNaN(studentIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId - must be a number'
      });
    }

    const validSessionTypes = ['WEEKEND', 'WEEKDAY', 'TRIAL', 'MAKEUP'];
    if (!validSessionTypes.includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type. Must be one of: ' + validSessionTypes.join(', ')
      });
    }

    const validAttendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEFT_EARLY'];
    if (!validAttendanceStatuses.includes(attendanceStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status. Must be one of: ' + validAttendanceStatuses.join(', ')
      });
    }

    const sessionDateTime = new Date(sessionDate);
    if (isNaN(sessionDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session date format'
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentIdNum },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('📝 Student found:', student.name);

    // NEW: Check for duplicate session on same date (Lines 280-310)
    const startOfDay = new Date(sessionDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(sessionDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await prisma.trainingSession.findFirst({
      where: {
        studentId: studentIdNum,
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        sessionDate: true,
        sessionType: true,
        attendanceStatus: true,
        createdAt: true
      }
    });

    if (existingSession) {
      console.log('⚠️ Duplicate session detected:', {
        existingId: existingSession.id,
        student: student.name,
        date: sessionDate
      });

      return res.status(409).json({
        success: false,
        message: `Training session already exists for ${student.name} on ${sessionDate}`,
        duplicate: true,
        existingSession: {
          id: existingSession.id,
          date: existingSession.sessionDate,
          type: existingSession.sessionType,
          status: existingSession.attendanceStatus
        }
      });
    }

    // Create new session (no duplicate found)
    const session = await prisma.trainingSession.create({
      data: {
        studentId: studentIdNum,
        sessionType,
        sessionDate: sessionDateTime,
        notes: notes || null,
        attendanceStatus,
        createdBy: userId
      },
      include: {
        student: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            monthlyRate: true,
            isLegacyStudent: true 
          }
        },
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log('✅ Training session created successfully:', session.id);

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Training session logged successfully'
    });

  } catch (error) {
    console.error('❌ Training Sessions POST Error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A training session for this student and date may already exist'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID provided'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to log training session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}

async function handlePut(req, res, pathParts, userId) {
  try {
    if (pathParts.length !== 1 || isNaN(Number(pathParts[0]))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const sessionId = Number(pathParts[0]);
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found'
      });
    }

    const { 
      sessionType, 
      notes, 
      attendanceStatus 
    } = req.body;

    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        ...(sessionType && { sessionType }),
        ...(notes !== undefined && { notes }),
        ...(attendanceStatus && { attendanceStatus })
      },
      include: {
        student: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            monthlyRate: true,
            isLegacyStudent: true 
          }
        },
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Training session updated successfully'
    });

  } catch (error) {
    console.error('❌ Training Sessions PUT Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update training session'
    });
  }
}

async function handleDelete(req, res, pathParts) {
  try {
    if (pathParts.length !== 1 || isNaN(Number(pathParts[0]))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const sessionId = Number(pathParts[0]);
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        student: {
          select: { name: true }
        },
        sessionDate: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Training session not found'
      });
    }

    await prisma.trainingSession.delete({
      where: { id: sessionId }
    });

    console.log(`🗑️ Deleted session: ${session.student.name} on ${session.sessionDate}`);

    return res.status(200).json({
      success: true,
      message: 'Training session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Training Sessions DELETE Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete training session'
    });
  }
}