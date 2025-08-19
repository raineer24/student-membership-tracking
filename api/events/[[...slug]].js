// File: api/events/[[...slug]].js
// Line 1: Weekend Event Management API - Fixed destructuring and validation
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
    // Line 16: FIXED - Use same auth pattern as other working APIs
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Line 20: Route handling using URL parsing (same as reminders API)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Extract path parts after "/api/events"
    const parts = pathname.split("/").filter(Boolean);
    const eventsIndex = parts.indexOf("events");
    const pathParts = eventsIndex !== -1 ? parts.slice(eventsIndex + 1) : [];
    
    console.log("📅 Events API");
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
    
    // Line 51: Enhanced error handling following reminders API pattern
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

// Line 70: GET /api/events - Get all events
// GET /api/events/[id] - Get specific event
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
      // Get all events
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status; // active, past, upcoming
      
      const offset = (page - 1) * limit;
      
      // Line 101: Build where clause
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

// Line 160: POST /api/events - Create new event
async function handlePost(req, res, pathParts, userId) {
  try {
    // Only allow creation at root endpoint
    if (pathParts.length !== 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Line 171: FIXED - Proper destructuring from req.body
    const {
      eventType,
      title,
      message,
      startDate,
      endDate,
      sendSMS,
      priority = 'NORMAL'
    } = req.body;

    console.log('📝 Creating weekend event:', {
      eventType, title, startDate, endDate, sendSMS, priority, userId
    });

    // Line 185: Validation
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

    // Line 232: DISABLED - Allow multiple events on same date
    // Conflict checking disabled to allow multiple event types per day
    // const conflictingEvents = await prisma.weekendEvent.findMany({
    //   where: {
    //     AND: [
    //       { startDate: { lte: endDate ? new Date(endDate) : new Date(startDate) } },
    //       {
    //         OR: [
    //           { endDate: null },
    //           { endDate: { gte: new Date(startDate) } }
    //         ]
    //       },
    //       { eventType: eventType }, // Only check conflicts within same event type
    //       { eventType: { not: 'SMS' } } // SMS events don't conflict with anything
    //     ]
    //   }
    // });

    // if (conflictingEvents.length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `${eventType} event conflicts with existing ${eventType} event: "${conflictingEvents[0].title}"`
    //   });
    // }

    // Line 253: Create event
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
        estimatedReach: sendSMS ? await getStudentCount() : 0,
        estimatedCost: sendSMS ? await calculateSMSCost() : 0.00
      },
      include: {
        creator: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log('✅ Event created successfully:', event.id);

    // Line 272: Send SMS if requested
    if (sendSMS) {
      try {
        console.log('📱 Attempting to send SMS...');
        await sendEventSMS(event);
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

// Line 294: PUT /api/events/[id] - Update event
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

    // Line 316: Only creator can edit
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

// Line 354: DELETE /api/events/[id] - Delete event
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

// Line 394: Helper functions
async function getStudentCount() {
  try {
    const count = await prisma.student.count({
      where: {
        phone: { not: null }
      }
    });
    return count;
  } catch (error) {
    console.error('Error getting student count:', error);
    return 0;
  }
}

// Line 408: Calculate SMS cost helper
async function calculateSMSCost() {
  try {
    const studentCount = await getStudentCount();
    return parseFloat((studentCount * 0.35).toFixed(2));
  } catch (error) {
    console.error('Error calculating SMS cost:', error);
    return 0.00;
  }
}

// Line 419: ENHANCED - Send SMS to students using robust service
async function sendEventSMS(event) {
  try {
    // Get students with phone numbers
    const students = await prisma.student.findMany({
      where: {
        phone: { not: null }
      },
      select: {
        id: true,
        name: true,
        phone: true
      }
    });

    console.log(`📱 Sending SMS to ${students.length} students`);

    // Line 435: Prepare SMS message (truncate to 160 chars)
    const smsMessage = `${event.title} - ${event.message}`.substring(0, 160);

    // Line 438: ENHANCED - Use the same SMS service as reminders API
    const { sendSMSViaSemaphore } = await import("../../utils/smsService.js");
    
    // Line 441: Send SMS to each student using robust service
    const smsPromises = students.map(async (student) => {
      try {
        console.log(`📤 Sending SMS to ${student.name} (${student.phone}): ${smsMessage}`);
        
        // Line 446: Use the robust Semaphore service
        const smsResult = await sendSMSViaSemaphore(student.phone, smsMessage, {
          senderId: "OgmokBJJGym"
        });
        
        // Line 451: Create reminder record only if SMS was successful
        if (smsResult.success) {
          await prisma.reminder.create({
            data: {
              studentId: student.id,
              message: smsMessage,
              status: 'SENT',
              cost: 0.60,
              phoneNumber: smsResult.phone,
              method: 'SMS',
              response: `Weekend event SMS sent successfully via Semaphore. MessageID: ${smsResult.messageId || 'unknown'}`
            }
          });
          
          console.log(`✅ SMS sent successfully to ${student.name}`);
          return { success: true, studentId: student.id, messageId: smsResult.messageId };
        } else {
          console.log(`❌ SMS failed for ${student.name}: ${smsResult.error}`);
          
          // Create failed reminder record
          await prisma.reminder.create({
            data: {
              studentId: student.id,
              message: smsMessage,
              status: 'FAILED',
              cost: 0,
              phoneNumber: student.phone,
              method: 'SMS',
              response: `Weekend event SMS failed: ${smsResult.error}`
            }
          });
          
          return { success: false, studentId: student.id, error: smsResult.error };
        }
        
      } catch (error) {
        console.error(`Failed to send SMS to ${student.name}:`, error);
        
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
              response: `Weekend event SMS failed: ${error.message}`
            }
          });
        } catch (dbError) {
          console.error(`Failed to create reminder record for ${student.name}:`, dbError);
        }
        
        return { success: false, studentId: student.id, error: error.message };
      }
    });

    const results = await Promise.allSettled(smsPromises);
    
    // Line 500: Process results
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`📊 SMS sending results: ${successCount} successful, ${failCount} failed out of ${students.length} attempts`);
    
    return {
      totalStudents: students.length,
      successCount,
      failCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message || 'Unknown error' })
    };
    
  } catch (error) {
    console.error('Error in sendEventSMS:', error);
    throw error;
  }
}