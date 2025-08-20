// File: api/events/[[...slug]].js
// Line 1: ENHANCED - Weekend Event API with Selective Student Messaging
import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Line 7: CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Line 16: Authentication using working pattern
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Line 20: Route handling using URL parsing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Extract path parts after "/api/events"
    const parts = pathname.split("/").filter(Boolean);
    const eventsIndex = parts.indexOf("events");
    const pathParts = eventsIndex !== -1 ? parts.slice(eventsIndex + 1) : [];
    
    console.log("📅 Enhanced Events API");
    console.log("REQ.URL:", req.url);
    console.log("PATHNAME:", pathname);
    console.log("PATH PARTS:", pathParts);
    console.log("METHOD:", req.method);

    // Line 34: Route handling based on method and path
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
    console.error('Events API Error:', error);
    
    // Line 51: Enhanced error handling
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

// Line 70: GET endpoints - unchanged from original
async function handleGet(req, res, pathParts) {
  try {
    if (pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      // Get specific event
      const eventId = Number(pathParts[0]);
      const event = await prisma.weekendEvent.findUnique({
        where: { id: eventId },
        include: {
          creator: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: event
      });
    } else if (pathParts.length === 0) {
      // Get all events with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status; // active, past, upcoming
      
      const offset = (page - 1) * limit;
      
      // Build where clause for status filtering
      let whereClause = {};
      const now = new Date();
      
      if (status === 'active') {
        whereClause = {
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        };
      } else if (status === 'past') {
        whereClause = {
          OR: [
            { endDate: { lt: now } },
            { 
              AND: [
                { endDate: null },
                { startDate: { lt: now } }
              ]
            }
          ]
        };
      } else if (status === 'upcoming') {
        whereClause = {
          startDate: { gt: now }
        };
      }

      const [events, total] = await Promise.all([
        prisma.weekendEvent.findMany({
          where: whereClause,
          include: {
            creator: {
              select: { id: true, email: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.weekendEvent.count({ where: whereClause })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
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
    console.error('Events GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
}

// Line 160: ENHANCED - POST endpoint with selective messaging
async function handlePost(req, res, pathParts, userId) {
  try {
    // Only allow creation at root endpoint
    if (pathParts.length !== 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Line 171: ENHANCED - Extract recipient options from request
    const {
      eventType,
      title,
      message,
      startDate,
      endDate,
      sendSMS,
      priority = 'NORMAL',
      recipientOptions // NEW: Selective messaging options
    } = req.body;

    console.log('📝 Creating weekend event with selective messaging:', {
      eventType, title, startDate, endDate, sendSMS, priority, recipientOptions, userId
    });

    // Line 185: Validation (unchanged)
    if (!eventType || !title || !message || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventType, title, message, startDate'
      });
    }

    // Line 193: Validate event type
    const validEventTypes = ['NO_CLASSES', 'GENERAL', 'BANNER', 'SMS'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type. Must be one of: ' + validEventTypes.join(', ')
      });
    }

    // Line 203: Validate priority
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
    }

    // Line 212: Validate dates
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Line 232: NEW - Validate recipient options if SMS is enabled
    if (sendSMS && recipientOptions) {
      const validOptions = ['activeStudents', 'expiringStudents', 'overdueStudents', 'inactiveStudents'];
      const hasValidOptions = Object.keys(recipientOptions).some(key => 
        validOptions.includes(key) && recipientOptions[key] === true
      );

      if (!hasValidOptions) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient category must be selected for SMS'
        });
      }
    }

    // Line 246: Calculate recipient statistics
    const recipientStats = sendSMS ? await calculateRecipientStats(recipientOptions) : {
      totalStudents: 0,
      estimatedCost: 0.00
    };

    // Line 253: Create event with enhanced data
    const event = await prisma.weekendEvent.create({
      data: {
        eventType,
        title: title.trim(),
        message: message.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        sendSMS: Boolean(sendSMS),
        priority,
        creatorId: userId,
        estimatedReach: recipientStats.totalStudents,
        estimatedCost: recipientStats.estimatedCost
      },
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log('✅ Event created successfully:', event.id);

    // Line 275: ENHANCED - Send SMS with selective targeting
    if (sendSMS) {
      try {
        console.log('📱 Attempting to send selective SMS...');
        const smsResults = await sendSelectiveEventSMS(event, recipientOptions);
        
        // Update event with actual SMS results
        await prisma.weekendEvent.update({
          where: { id: event.id },
          data: {
            estimatedReach: smsResults.successCount,
            estimatedCost: smsResults.successCount * 0.60
          }
        });
        
        console.log(`✅ SMS sent to ${smsResults.successCount}/${smsResults.totalAttempts} students`);
        
      } catch (smsError) {
        console.error('❌ SMS sending failed:', smsError);
        // Continue - event is created, SMS failure is logged
      }
    }

    return res.status(201).json({
      success: true,
      data: event,
      message: 'Weekend event created successfully'
    });

  } catch (error) {
    console.error('Events POST Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Line 309: PUT and DELETE handlers unchanged from original
async function handlePut(req, res, pathParts, userId) {
  try {
    if (pathParts.length !== 1 || isNaN(Number(pathParts[0]))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const eventId = Number(pathParts[0]);
    const event = await prisma.weekendEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only creator can edit
    if (event.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the event creator can edit this event'
      });
    }

    const { title, message, endDate, priority } = req.body;

    const updatedEvent = await prisma.weekendEvent.update({
      where: { id: eventId },
      data: {
        ...(title && { title: title.trim() }),
        ...(message && { message: message.trim() }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(priority && { priority }),
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Events PUT Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
}

async function handleDelete(req, res, pathParts) {
  try {
    if (pathParts.length !== 1 || isNaN(Number(pathParts[0]))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const eventId = Number(pathParts[0]);
    const event = await prisma.weekendEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await prisma.weekendEvent.delete({
      where: { id: eventId }
    });

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Events DELETE Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
}

// Line 400: NEW - Helper function to calculate recipient statistics
async function calculateRecipientStats(recipientOptions) {
  try {
    if (!recipientOptions) {
      return { totalStudents: 0, estimatedCost: 0.00 };
    }

    // Get all students with phone numbers
    const students = await prisma.student.findMany({
      where: {
        phone: { not: null }
      },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Line 417: Helper function to determine student status (matches frontend logic)
    const getStudentStatus = (student) => {
      if (!student?.memberships || student.memberships.length === 0) {
        return "inactive";
      }

      const latestMembership = student.memberships[0]; // Already sorted by createdAt desc
      if (!latestMembership?.endDate) return "inactive";

      const endDate = new Date(latestMembership.endDate);
      const today = new Date();
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.ceil((endDateOnly - todayOnly) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "overdue";
      if (diffDays <= 7) return "expiring";
      return "active";
    };

    // Line 437: Count students by category and filter by selected options
    let totalSelected = 0;
    
    students.forEach(student => {
      const status = getStudentStatus(student);
      
      // Check if this student category is selected for SMS
      if (
        (status === "active" && recipientOptions.activeStudents) ||
        (status === "expiring" && recipientOptions.expiringStudents) ||
        (status === "overdue" && recipientOptions.overdueStudents) ||
        (status === "inactive" && recipientOptions.inactiveStudents)
      ) {
        totalSelected++;
      }
    });

    const estimatedCost = totalSelected * 0.60; // ₱0.60 per SMS

    console.log(`📊 Recipient calculation: ${totalSelected} students selected for SMS (₱${estimatedCost.toFixed(2)})`);

    return {
      totalStudents: totalSelected,
      estimatedCost: parseFloat(estimatedCost.toFixed(2))
    };

  } catch (error) {
    console.error('Error calculating recipient stats:', error);
    return { totalStudents: 0, estimatedCost: 0.00 };
  }
}

// Line 465: ENHANCED - Send SMS to selected student categories only
async function sendSelectiveEventSMS(event, recipientOptions) {
  try {
    // Get students with phone numbers and their membership data
    const students = await prisma.student.findMany({
      where: {
        phone: { not: null }
      },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' }
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        memberships: true
      }
    });

    console.log(`📱 Found ${students.length} students with phone numbers`);

    // Line 486: Helper function to determine student status (same logic as calculateRecipientStats)
    const getStudentStatus = (student) => {
      if (!student?.memberships || student.memberships.length === 0) {
        return "inactive";
      }

      const latestMembership = student.memberships[0];
      if (!latestMembership?.endDate) return "inactive";

      const endDate = new Date(latestMembership.endDate);
      const today = new Date();
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.ceil((endDateOnly - todayOnly) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "overdue";
      if (diffDays <= 7) return "expiring";
      return "active";
    };

    // Line 505: Filter students based on recipient options
    const eligibleStudents = students.filter(student => {
      if (!recipientOptions) return false; // No options = no recipients
      
      const status = getStudentStatus(student);
      
      return (
        (status === "active" && recipientOptions.activeStudents) ||
        (status === "expiring" && recipientOptions.expiringStudents) ||
        (status === "overdue" && recipientOptions.overdueStudents) ||
        (status === "inactive" && recipientOptions.inactiveStudents)
      );
    });

    console.log(`📝 Filtered to ${eligibleStudents.length} eligible students based on selection:`, recipientOptions);

    if (eligibleStudents.length === 0) {
      console.log('⚠️ No eligible students found for SMS');
      return {
        totalAttempts: 0,
        successCount: 0,
        failCount: 0,
        results: []
      };
    }

    // Line 527: Prepare SMS message (truncate to 160 chars for SMS)
    const smsMessage = `${event.title} - ${event.message}`.substring(0, 160);

    // Line 530: Use the robust SMS service from reminders API
    const { sendSMSViaSemaphore } = await import("../../utils/smsService.js");
    
    // Line 533: Send SMS to each eligible student
    const smsPromises = eligibleStudents.map(async (student) => {
      try {
        console.log(`📤 Sending selective SMS to ${student.name} (${student.phone}): ${smsMessage}`);
        
        // Use the robust Semaphore service
        const smsResult = await sendSMSViaSemaphore(student.phone, smsMessage, {
          senderId: "OgmokBJJGym"
        });
        
        // Create reminder record with enhanced metadata
        if (smsResult.success) {
          await prisma.reminder.create({
            data: {
              studentId: student.id,
              message: smsMessage,
              status: 'SENT',
              cost: 0.60,
              phoneNumber: smsResult.phone,
              method: 'SMS',
              response: `Weekend event SMS (selective) sent successfully via Semaphore. Event ID: ${event.id}, MessageID: ${smsResult.messageId || 'unknown'}`
            }
          });
          
          console.log(`✅ Selective SMS sent successfully to ${student.name}`);
          return { success: true, studentId: student.id, messageId: smsResult.messageId };
        } else {
          console.log(`❌ Selective SMS failed for ${student.name}: ${smsResult.error}`);
          
          // Create failed reminder record
          await prisma.reminder.create({
            data: {
              studentId: student.id,
              message: smsMessage,
              status: 'FAILED',
              cost: 0,
              phoneNumber: student.phone,
              method: 'SMS',
              response: `Weekend event SMS (selective) failed: ${smsResult.error}. Event ID: ${event.id}`
            }
          });
          
          return { success: false, studentId: student.id, error: smsResult.error };
        }
        
      } catch (error) {
        console.error(`Failed to send selective SMS to ${student.name}:`, error);
        
        // Create failed reminder record
        try {
          await prisma.reminder.create({
            data: {
              studentId: student.id,
              message: smsMessage,
              status: 'FAILED',
              cost: 0,
              phoneNumber: student.phone,
              method: 'SMS',
              response: `Weekend event SMS (selective) failed: ${error.message}. Event ID: ${event.id}`
            }
          });
        } catch (dbError) {
          console.error(`Failed to create reminder record for ${student.name}:`, dbError);
        }
        
        return { success: false, studentId: student.id, error: error.message };
      }
    });

    const results = await Promise.allSettled(smsPromises);
    
    // Line 589: Process results
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`📊 Selective SMS results: ${successCount} successful, ${failCount} failed out of ${eligibleStudents.length} attempts`);
    console.log(`🎯 Recipient selection was:`, recipientOptions);
    
    return {
      totalAttempts: eligibleStudents.length,
      successCount,
      failCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message || 'Unknown error' })
    };
    
  } catch (error) {
    console.error('Error in sendSelectiveEventSMS:', error);
    throw error;
  }
}