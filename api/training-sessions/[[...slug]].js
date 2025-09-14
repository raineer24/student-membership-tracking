// File: api/training-sessions/[[...slug]].js
// Lines 1-50: Training Sessions API Handler - EXACT SAME PATTERN as Events API
import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Lines 7-15: CORS headers - EXACT SAME PATTERN as Events API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Lines 16-18: Authentication - EXACT SAME PATTERN as Events API
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Lines 20-30: Route handling - EXACT SAME PATTERN as Events API
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    const parts = pathname.split("/").filter(Boolean);
    const sessionsIndex = parts.indexOf("training-sessions");
    const pathParts = sessionsIndex !== -1 ? parts.slice(sessionsIndex + 1) : [];
    
    console.log("🥋 Training Sessions API");
    console.log("REQ.URL:", req.url);
    console.log("PATHNAME:", pathname);
    console.log("PATH PARTS:", pathParts);
    console.log("METHOD:", req.method);

    // Lines 34-48: Route handling - EXACT SAME PATTERN as Events API
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
    console.error('Training Sessions API Error:', error);
    
    // Lines 51-70: Enhanced error handling - EXACT SAME PATTERN as Events API
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

// Lines 75-180: GET endpoints - Comprehensive Training Session Analytics
async function handleGet(req, res, pathParts) {
  try {
    if (pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      // Get specific training session
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
    } else if (pathParts.length === 0) {
      // Lines 110-150: Get all sessions with martial arts specific analytics
      const { 
        studentId, 
        startDate, 
        endDate, 
        sessionType,
        page = 1,
        limit = 50,
        analytics = 'true'
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause for filtering
      let whereClause = {};
      
      if (studentId) {
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
      
      if (sessionType && ['WEEKEND', 'WEEKDAY', 'TRIAL'].includes(sessionType)) {
        whereClause.sessionType = sessionType;
      }

      // Fetch training sessions with student data
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

      // Lines 155-180: Calculate martial arts specific analytics if requested
      let analyticsData = null;
      if (analytics === 'true' && !studentId) {
        analyticsData = await calculateTrainingAnalytics();
      }

      return res.status(200).json({
        success: true,
        data: {
          sessions,
          analytics: analyticsData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
  } catch (error) {
    console.error('Training Sessions GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch training sessions'
    });
  }
}

// Lines 185-280: POST endpoint - Log Training Session with Business Logic
async function handlePost(req, res, pathParts, userId) {
  try {
    // Only allow creation at root endpoint
    if (pathParts.length !== 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const {
      studentId,
      sessionType = 'WEEKEND', // Default to weekend (primary schedule)
      sessionDate,
      duration = 90, // Default 90-minute sessions
      notes,
      skillsWorkedOn = [],
      attendanceStatus = 'PRESENT'
    } = req.body;

    console.log('📝 Logging training session:', {
      studentId, sessionType, sessionDate, duration, attendanceStatus, userId
    });

    // Lines 210-225: Validation
    if (!studentId || !sessionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, sessionDate'
      });
    }

    // Validate session type
    const validSessionTypes = ['WEEKEND', 'WEEKDAY', 'TRIAL', 'MAKEUP'];
    if (!validSessionTypes.includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type. Must be one of: ' + validSessionTypes.join(', ')
      });
    }

    // Validate attendance status
    const validAttendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEFT_EARLY'];
    if (!validAttendanceStatuses.includes(attendanceStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status. Must be one of: ' + validAttendanceStatuses.join(', ')
      });
    }

    // Lines 240-255: Validate student exists and has active membership
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Business rule: Check if student has active membership
    const hasActiveMembership = student.memberships.length > 0 && 
      student.memberships[0].endDate && 
      new Date(student.memberships[0].endDate) > new Date();

    if (!hasActiveMembership && sessionType !== 'TRIAL') {
      return res.status(400).json({
        success: false,
        message: 'Student must have active membership to log non-trial sessions'
      });
    }

    // Lines 260-280: Create training session
    const session = await prisma.trainingSession.create({
      data: {
        studentId: parseInt(studentId),
        sessionType,
        sessionDate: new Date(sessionDate),
        duration: parseInt(duration),
        notes: notes || null,
        skillsWorkedOn: Array.isArray(skillsWorkedOn) ? skillsWorkedOn : [],
        attendanceStatus,
        creatorId: userId
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

    console.log('✅ Training session logged successfully:', session.id);

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Training session logged successfully'
    });

  } catch (error) {
    console.error('Training Sessions POST Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log training session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lines 285-350: PUT endpoint - Update Training Session
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

    // Only creator can edit
    if (session.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the session creator can edit this session'
      });
    }

    const { 
      sessionType, 
      duration, 
      notes, 
      skillsWorkedOn, 
      attendanceStatus 
    } = req.body;

    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        ...(sessionType && { sessionType }),
        ...(duration && { duration: parseInt(duration) }),
        ...(notes !== undefined && { notes }),
        ...(skillsWorkedOn && { skillsWorkedOn: Array.isArray(skillsWorkedOn) ? skillsWorkedOn : [] }),
        ...(attendanceStatus && { attendanceStatus }),
        updatedAt: new Date()
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
    console.error('Training Sessions PUT Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update training session'
    });
  }
}

// Lines 355-390: DELETE endpoint
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
      where: { id: sessionId }
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

    return res.status(200).json({
      success: true,
      message: 'Training session deleted successfully'
    });

  } catch (error) {
    console.error('Training Sessions DELETE Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete training session'
    });
  }
}

// Lines 395-500: Martial Arts Specific Analytics Helper
async function calculateTrainingAnalytics() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all students with their training data
    const students = await prisma.student.findMany({
      include: {
        trainingSessions: {
          where: {
            sessionDate: { gte: thirtyDaysAgo }
          },
          orderBy: { sessionDate: 'desc' }
        },
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paidAt: 'desc' },
          take: 1
        }
      }
    });

    // Lines 425-470: Calculate training session analytics
    let totalStudents = 0;
    let activePayingStudents = 0;
    let studentsWithRecentTraining = 0;
    let studentsInactive30Days = 0;
    let studentsWithoutTraining = 0;
    let revenueAtRisk = 0;

    students.forEach(student => {
      totalStudents++;

      // Check if student is paying
      const hasActivePayment = student.payments.length > 0;
      const hasActiveMembership = student.memberships.length > 0 && 
        student.memberships[0].endDate && 
        new Date(student.memberships[0].endDate) > new Date();

      if (hasActivePayment && hasActiveMembership) {
        activePayingStudents++;
        const monthlyRate = student.monthlyRate || 1400;

        // Check training activity
        const recentSessions = student.trainingSessions.filter(session => 
          new Date(session.sessionDate) >= sevenDaysAgo
        );

        const sessionsLast30Days = student.trainingSessions.length;

        if (recentSessions.length > 0) {
          studentsWithRecentTraining++;
        } else if (sessionsLast30Days === 0) {
          studentsWithoutTraining++;
          revenueAtRisk += monthlyRate;
        } else {
          // Has some sessions in 30 days but none in 7 days
          const lastSession = student.trainingSessions[0];
          const daysSinceLastSession = Math.floor(
            (new Date() - new Date(lastSession.sessionDate)) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastSession >= 30) {
            studentsInactive30Days++;
            revenueAtRisk += monthlyRate;
          }
        }
      }
    });

    // Lines 475-500: Weekend vs Weekday analysis
    const weekendSessions = await prisma.trainingSession.count({
      where: {
        sessionType: 'WEEKEND',
        sessionDate: { gte: thirtyDaysAgo }
      }
    });

    const weekdaySessions = await prisma.trainingSession.count({
      where: {
        sessionType: 'WEEKDAY',
        sessionDate: { gte: thirtyDaysAgo }
      }
    });

    return {
      overview: {
        totalStudents,
        activePayingStudents,
        studentsWithRecentTraining,
        studentsInactive30Days,
        studentsWithoutTraining,
        revenueAtRisk,
        revenueAtRiskFormatted: `₱${revenueAtRisk.toLocaleString()}`
      },
      trainingFrequency: {
        weekendSessions,
        weekdaySessions,
        totalSessions: weekendSessions + weekdaySessions,
        weekendPercentage: weekendSessions > 0 ? Math.round((weekendSessions / (weekendSessions + weekdaySessions)) * 100) : 0
      },
      businessInsights: {
        attendanceRate: activePayingStudents > 0 ? Math.round((studentsWithRecentTraining / activePayingStudents) * 100) : 0,
        riskLevel: studentsInactive30Days > 0 ? 'HIGH' : studentsWithoutTraining > 0 ? 'MEDIUM' : 'LOW',
        recommendations: generateBusinessRecommendations(studentsInactive30Days, studentsWithoutTraining, revenueAtRisk)
      }
    };

  } catch (error) {
    console.error('Error calculating training analytics:', error);
    return {
      overview: { error: 'Unable to calculate analytics' },
      trainingFrequency: {},
      businessInsights: {}
    };
  }
}

// Lines 505-525: Business Recommendations Generator
function generateBusinessRecommendations(inactive30Days, neverTrained, revenueAtRisk) {
  const recommendations = [];

  if (inactive30Days > 0) {
    recommendations.push(`Follow up with ${inactive30Days} students who haven't trained in 30+ days to prevent membership cancellation`);
  }

  if (neverTrained > 0) {
    recommendations.push(`Contact ${neverTrained} paying students who have never attended to ensure they start training`);
  }

  if (revenueAtRisk > 0) {
    recommendations.push(`₱${revenueAtRisk.toLocaleString()} monthly revenue at risk from inactive students`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent! All paying students are actively training.');
  }

  return recommendations;
}