// Line 1: Complete Enhanced SMS Reminder API - Following Payments API Pattern
// Uses the exact same database import and structure as payments API
import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";
import {
  isValidPhilippinePhone,
  normalizePhoneNumber,
  formatPhoneForDisplay,
  getNetworkProvider,
} from "../../utils/phoneUtils.js";

// Line 10: Helper function for consistent date formatting in logs
const formatDateForLog = (date) => {
  return date.toISOString().split('T')[0];
};

// Line 15: Helper function to generate context-aware reminder messages
const generateReminderMessage = (student) => {
  const activeMembership = student.memberships[0];

  if (!activeMembership) {
    return `Hi ${student.name}! Your gym membership has expired. Please visit us to renew and continue your fitness journey. Thank you!`;
  }

  // Calculate days overdue with enhanced messaging
  const endDate = new Date(activeMembership.endDate);
  const today = new Date();
  const daysOverdue = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));

  // Generate contextual messages based on overdue period
  if (daysOverdue <= 0) {
    // Not actually overdue - membership is still active
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return `Hi ${student.name}! Your gym membership expires in ${daysUntilExpiry} days. Please renew soon to avoid service interruption. Thank you!`;
  } else if (daysOverdue <= 3) {
    return `Hi ${student.name}! Your gym membership expired ${daysOverdue} day(s) ago. Please renew soon to continue enjoying our facilities. Thank you!`;
  } else if (daysOverdue <= 7) {
    return `Hi ${student.name}! Your membership has been overdue for ${daysOverdue} days. Please renew to continue accessing our facilities. Thank you!`;
  } else if (daysOverdue <= 14) {
    return `Hi ${student.name}! Your membership expired ${daysOverdue} days ago. Please visit us to renew and restore your access immediately. Thank you!`;
  } else if (daysOverdue <= 30) {
    return `Hi ${student.name}! Your membership has been expired for ${daysOverdue} days. Please contact us to discuss renewal options. Thank you!`;
  } else {
    return `Hi ${student.name}! Your membership expired over a month ago. Please contact us at your earliest convenience to discuss reactivation. Thank you!`;
  }
};

// Line 40: Main API handler function - Following payments API pattern exactly
export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Extract path parts after "/api/reminders" - same pattern as payments API
  const parts = pathname.split("/").filter(Boolean);
  const remindersIndex = parts.indexOf("reminders");
  const pathParts = remindersIndex !== -1 ? parts.slice(remindersIndex + 1) : [];

  console.log("📱 Enhanced SMS Reminder API");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);
  console.log("METHOD:", method);
  console.log("BODY:", req.body);

  try {
    const user = await authenticate(req);

    // Line 60: GET /api/reminders - Basic reminder statistics for dashboard
    if (method === "GET" && pathParts.length === 0) {
      await authorizeRole("ADMIN", user);

      // Get today's reminder count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await prisma.reminder.count({
        where: {
          sentAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Get total reminder count and recent activity
      const totalCount = await prisma.reminder.count();
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentReminders = await prisma.reminder.findMany({
        where: {
          sentAt: { gte: last24Hours },
        },
        select: {
          status: true,
          cost: true,
        },
      });

      // Calculate status distribution and costs
      const statusCounts = recentReminders.reduce((acc, reminder) => {
        acc[reminder.status] = (acc[reminder.status] || 0) + 1;
        return acc;
      }, {});

      const totalCost24h = recentReminders.reduce((sum, reminder) => {
        return sum + (reminder.cost || 0);
      }, 0);

      // Service health information
      const serviceHealth = {
        semaphoreConfigured: !!process.env.SEMAPHORE_API_KEY,
        databaseConnected: true,
        lastReminderSent: await getLastReminderTime()
      };

      console.log("✅ Statistics fetched successfully");

      return res.status(200).json({
        success: true,
        data: {
          todayCount,
          totalCount,
          last24HoursCount: recentReminders.length,
          statusDistribution: statusCounts,
          costs: {
            last24Hours: totalCost24h,
            perSMS: 0.60,
            currency: "PHP"
          },
          serviceHealth,
          message: "Semaphore SMS reminder service operational",
          provider: "Semaphore",
          costPerSMS: 0.60
        },
        timestamp: new Date().toISOString()
      });
    }

    // Line 120: GET /api/reminders/history - Paginated reminder history
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "history") {
      await authorizeRole("ADMIN", user);

      const { 
        page = 1, 
        limit = 20, 
        studentId, 
        status, 
        days = 30,
        sortBy = 'sentAt',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      console.log("📋 Fetching reminder history with filters:", {
        page, limit, studentId, status, days, sortBy, sortOrder
      });

      // Build date filter for time range
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(days));

      // Build where clause with optional filters
      const whereClause = {
        sentAt: { gte: dateFilter },
      };

      if (studentId && !isNaN(studentId)) {
        whereClause.studentId = parseInt(studentId);
      }

      if (status && ['SENT', 'FAILED', 'PENDING', 'TEST_SENT'].includes(status)) {
        whereClause.status = status;
      }

      // Get total count for pagination
      const totalCount = await prisma.reminder.count({ where: whereClause });

      // Fetch reminders with student details
      const validSortFields = ['sentAt', 'status', 'cost', 'studentId'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'sentAt';
      const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

      const reminders = await prisma.reminder.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { [sortField]: sortDirection },
        take: parseInt(limit),
        skip: offset,
      });

      // Format reminders for response
      const formattedReminders = reminders.map((reminder) => ({
        id: reminder.id,
        studentId: reminder.studentId,
        studentName: reminder.student.name,
        studentEmail: reminder.student.email,
        phone: formatPhoneForDisplay(reminder.phoneNumber || reminder.student.phone),
        method: reminder.method,
        status: reminder.status,
        message: reminder.message?.substring(0, 100) + (reminder.message?.length > 100 ? "..." : ""),
        fullMessage: reminder.message,
        cost: reminder.cost || 0.60,
        sentAt: reminder.sentAt,
        response: reminder.response,
        retryCount: reminder.retryCount || 0,
        network: getNetworkProvider(reminder.phoneNumber || reminder.student.phone),
        messageLength: reminder.message?.length || 0,
        isTest: reminder.status === 'TEST_SENT'
      }));

      console.log("✅ History fetched successfully:", formattedReminders.length, "records");

      return res.status(200).json({
        success: true,
        data: {
          reminders: formattedReminders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            hasNext: (parseInt(page) * parseInt(limit)) < totalCount,
            hasPrev: parseInt(page) > 1
          },
          summary: {
            totalReminders: totalCount,
            dateRange: `Last ${days} days`,
            filters: { studentId, status }
          },
          provider: "Semaphore"
        },
        timestamp: new Date().toISOString()
      });
    }

    // Line 220: GET /api/reminders/credits - Check SMS credit balance
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "credits") {
      await authorizeRole("ADMIN", user);

      console.log("💰 Checking Semaphore SMS credits...");
      
      const apiKey = process.env.SEMAPHORE_API_KEY;

      // Return zero balance when no API key is configured
      if (!apiKey) {
        console.log("⚠️ No Semaphore API key configured");
        
        const noApiKeyCredits = {
          balance: 0,
          used: 0,
          remaining: 0,
          costPerSMS: 0.60,
          currency: "PHP",
          lowBalance: true,
          lastUpdated: new Date().toISOString(),
          messagesRemaining: 0,
          provider: "Semaphore",
          note: "SMS service not configured. Add SEMAPHORE_API_KEY to environment variables."
        };

        return res.status(200).json({
          success: true,
          data: noApiKeyCredits,
          message: "SMS service not configured",
          warning: "Configure SEMAPHORE_API_KEY for SMS functionality"
        });
      }

      // Import SMS service to check actual credits
      try {
        const { checkSMSCredits } = await import("../../utils/smsService.js");
        const creditsResult = await checkSMSCredits();

        if (creditsResult.success) {
          console.log("✅ Credits retrieved successfully");
          return res.status(200).json({
            success: true,
            data: {
              ...creditsResult.data,
              provider: "Semaphore"
            },
            message: "Semaphore credits retrieved successfully",
            timestamp: new Date().toISOString()
          });
        } else {
          // Return zero balance data if API fails
          console.log("⚠️ Credits API failed");
          const apiFailureCredits = {
            balance: 0,
            used: 0,
            remaining: 0,
            costPerSMS: 0.60,
            currency: "PHP",
            lowBalance: true,
            lastUpdated: new Date().toISOString(),
            messagesRemaining: 0,
            provider: "Semaphore",
            note: "Unable to fetch current balance - Semaphore service temporarily unavailable",
            error: creditsResult.error
          };

          return res.status(200).json({
            success: true,
            data: apiFailureCredits,
            message: "SMS credits unavailable",
            warning: "Semaphore service temporarily unavailable"
          });
        }
      } catch (error) {
        console.error("❌ Error checking Semaphore credits:", error);

        // Return zero balance on error
        return res.status(500).json({
          success: false,
          error: "Failed to check SMS credits",
          data: {
            balance: 0,
            used: 0,
            remaining: 0,
            costPerSMS: 0.60,
            currency: "PHP",
            lowBalance: true,
            lastUpdated: new Date().toISOString(),
            messagesRemaining: 0,
            provider: "Semaphore"
          },
          details: error.message
        });
      }
    }

    // Line 300: POST /api/reminders/send - Send SMS reminder to student
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "send") {
      await authorizeRole("ADMIN", user);

      const { 
        studentId, 
        customMessage, 
        testMode = false,
        senderId = "GymReminder"
      } = req.body;

      console.log("📤 Processing SMS reminder request:", {
        studentId, testMode, senderId, hasCustomMessage: !!customMessage
      });

      // Validate required parameters
      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({
          success: false,
          error: "Valid student ID is required"
        });
      }

      // Fetch student with comprehensive data
      const student = await prisma.student.findUnique({
        where: { id: parseInt(studentId) },
        include: {
          memberships: {
            where: { isActive: true },
            orderBy: { endDate: "desc" },
            take: 1,
          },
          reminders: {
            where: {
              sentAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
            orderBy: { sentAt: "desc" },
            take: 1,
          },
        },
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
          message: `No student found with ID: ${studentId}`
        });
      }

      console.log("👤 Student found:", student.name, "Phone:", student.phone);

      // Enhanced phone number validation
      if (!student.phone || !isValidPhilippinePhone(student.phone)) {
        return res.status(400).json({
          success: false,
          error: "Invalid phone number",
          message: "Student has no valid Philippine mobile number on file",
          studentName: student.name,
          currentPhone: student.phone || "Not provided"
        });
      }

      // Rate limiting check
      if (student.reminders.length > 0) {
        const lastReminder = student.reminders[0];
        const timeSinceLastReminder = Date.now() - new Date(lastReminder.sentAt).getTime();
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastReminder) / (60 * 60 * 1000));

        if (timeSinceLastReminder < 24 * 60 * 60 * 1000) {
          return res.status(429).json({
            success: false,
            error: "Rate limited",
            message: `Rate limit active. Can send another reminder in ${hoursLeft} hours.`,
            rateLimitInfo: {
              lastReminderSent: lastReminder.sentAt,
              hoursUntilNext: hoursLeft
            }
          });
        }
      }

      // Generate reminder message
      const message = customMessage || generateReminderMessage(student);
      const normalizedPhone = normalizePhoneNumber(student.phone);
      const network = getNetworkProvider(normalizedPhone);

      console.log("📝 Message generated:", message.length, "characters");
      console.log("📱 Target phone:", normalizedPhone, "Network:", network);

      // Test mode processing
      if (testMode || process.env.NODE_ENV === "development") {
        console.log("🧪 === TEST MODE SMS REMINDER ===");
        console.log("👤 Student:", student.name);
        console.log("📱 Phone:", normalizedPhone);
        console.log("🌐 Network:", network);
        console.log("📝 Message:", message);
        console.log("📏 Length:", message.length, "characters");
        console.log("💰 Estimated Cost: ₱0.60");
        console.log("==============================");

        // Create test reminder record
        const reminder = await prisma.reminder.create({
          data: {
            studentId: parseInt(studentId),
            method: "SMS",
            status: "TEST_SENT",
            message: message,
            phoneNumber: normalizedPhone,
            cost: 0.60,
            response: "Test mode - no actual SMS sent via Semaphore",
          },
        });

        return res.status(200).json({
          success: true,
          testMode: true,
          message: "Test reminder logged successfully",
          data: {
            reminderId: reminder.id,
            studentName: student.name,
            phone: formatPhoneForDisplay(normalizedPhone),
            messageLength: message.length,
            estimatedCost: 0.60,
            network: network,
            provider: "Semaphore",
            senderId: senderId,
            message: message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Production mode - send actual SMS via Semaphore
      let smsResult = null;
      let reminderStatus = "FAILED";
      let responseText = "";

      try {
        console.log("📡 Sending SMS via Semaphore...");
        
        // Import SMS service dynamically
        const { sendSMSViaSemaphore } = await import("../../utils/smsService.js");

        smsResult = await sendSMSViaSemaphore(normalizedPhone, message, {
          senderId: senderId
        });
        
        reminderStatus = smsResult.success ? "SENT" : "FAILED";
        responseText = smsResult.response || smsResult.error || "Unknown error";
        
        console.log("📨 SMS Result:", reminderStatus, responseText);
      } catch (smsError) {
        console.error("❌ SMS sending failed:", smsError);
        reminderStatus = "FAILED";
        responseText = smsError.message || "Semaphore service error";
      }

      // Create reminder record
      const reminder = await prisma.reminder.create({
        data: {
          studentId: parseInt(studentId),
          method: "SMS",
          status: reminderStatus,
          message: message,
          phoneNumber: normalizedPhone,
          cost: reminderStatus === "SENT" ? 0.60 : 0,
          response: responseText,
        },
      });

      // Return response based on SMS result
      if (reminderStatus === "SENT") {
        console.log("✅ SMS sent successfully!");
        return res.status(200).json({
          success: true,
          message: "SMS reminder sent successfully via Semaphore",
          data: {
            reminderId: reminder.id,
            studentName: student.name,
            phone: formatPhoneForDisplay(normalizedPhone),
            messageLength: message.length,
            cost: 0.60,
            network: network,
            sentAt: reminder.sentAt,
            provider: "Semaphore",
            messageId: smsResult?.messageId || null
          },
          timestamp: new Date().toISOString()
        });
      } else {
        console.log("❌ SMS sending failed");
        return res.status(500).json({
          success: false,
          error: `Failed to send SMS via Semaphore: ${responseText}`,
          data: {
            reminderId: reminder.id,
            studentName: student.name,
            phone: formatPhoneForDisplay(normalizedPhone),
            provider: "Semaphore",
            errorDetails: responseText
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Line 480: POST /api/reminders/test - Test SMS functionality safely
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "test") {
      await authorizeRole("ADMIN", user);

      const {
        phone,
        message = "This is a test message from your gym management system via Semaphore SMS service.",
        senderId = "GymTest"
      } = req.body;

      console.log("🧪 Processing SMS test request");

      // Validate required parameters
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: "Phone number is required for testing"
        });
      }

      if (!isValidPhilippinePhone(phone)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Philippine phone number format",
          message: "Expected format: +639XXXXXXXXX or 09XXXXXXXXX",
          receivedPhone: phone
        });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const network = getNetworkProvider(normalizedPhone);

      // Test mode logging
      console.log("🧪 === SEMAPHORE SMS TEST ===");
      console.log("📱 Phone:", normalizedPhone);
      console.log("🌐 Network:", network);
      console.log("📝 Message:", message);
      console.log("📏 Length:", message.length, "characters");
      console.log("👤 Sender ID:", senderId);
      console.log("💰 Cost: ₱0.60");
      console.log("==========================");

      // Validate SMS service configuration
      const apiKey = process.env.SEMAPHORE_API_KEY;
      const serviceConfigured = !!apiKey;

      return res.status(200).json({
        success: true,
        testMode: true,
        message: "SMS test completed successfully",
        data: {
          phone: formatPhoneForDisplay(normalizedPhone),
          messageLength: message.length,
          network: network,
          estimatedCost: 0.60,
          provider: "Semaphore",
          senderId: senderId,
          validation: {
            phoneValid: true,
            messageValid: message.length > 0 && message.length <= 160,
            serviceConfigured: serviceConfigured
          },
          recommendations: serviceConfigured ? [] : [
            "Configure SEMAPHORE_API_KEY environment variable for actual SMS sending"
          ]
        },
        timestamp: new Date().toISOString()
      });
    }

    // Line 550: GET /api/reminders/student/:id - Get reminders for specific student
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "student" && !isNaN(Number(pathParts[1]))) {
      await authorizeRole("ADMIN", user);

      const studentId = Number(pathParts[1]);
      console.log("👤 Fetching reminders for student:", studentId);

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, phone: true, email: true }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found"
        });
      }

      // Get reminders for this student
      const reminders = await prisma.reminder.findMany({
        where: { studentId: studentId },
        orderBy: { sentAt: 'desc' },
        take: 100 // Limit to last 100 reminders
      });

      // Calculate summary statistics
      const totalCost = reminders.reduce((sum, r) => sum + (r.cost || 0), 0);
      const statusBreakdown = reminders.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: {
          student: student,
          reminders: reminders.map(r => ({
            id: r.id,
            method: r.method,
            status: r.status,
            message: r.message?.substring(0, 100) + (r.message?.length > 100 ? "..." : ""),
            cost: r.cost || 0,
            sentAt: r.sentAt,
            response: r.response
          })),
          summary: {
            totalReminders: reminders.length,
            totalCost: totalCost,
            statusBreakdown: statusBreakdown,
            lastReminderSent: reminders[0]?.sentAt || null
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Line 610: DELETE /api/reminders/:id - Delete specific reminder
    if (method === "DELETE" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const reminderId = Number(pathParts[0]);
      console.log("🗑️ Deleting reminder:", reminderId);

      // Verify reminder exists
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
        include: {
          student: {
            select: { name: true, id: true },
          },
        },
      });

      if (!reminder) {
        return res.status(404).json({
          success: false,
          error: "Reminder not found"
        });
      }

      // Delete the reminder
      await prisma.reminder.delete({
        where: { id: reminderId },
      });

      console.log("✅ Reminder deleted successfully");

      return res.status(200).json({
        success: true,
        message: "Reminder deleted successfully",
        data: {
          deletedId: reminderId,
          studentName: reminder.student.name,
          studentId: reminder.student.id,
          sentAt: reminder.sentAt,
          status: reminder.status,
          provider: "Semaphore"
        },
        timestamp: new Date().toISOString()
      });
    }

    // Line 660: Unsupported route handler
    return res.status(404).json({
      success: false,
      error: "Route not found",
      availableRoutes: [
        "GET /api/reminders",
        "GET /api/reminders/history",
        "GET /api/reminders/credits",
        "POST /api/reminders/send",
        "POST /api/reminders/test",
        "GET /api/reminders/student/:id",
        "DELETE /api/reminders/:id"
      ]
    });

  } catch (err) {
    console.error("❌ Enhanced Reminders API ERROR:", err);
    
    // Enhanced error handling following payments API pattern
    if (err.message === "Authentication required") {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }
    
    if (err.message === "Unauthorized") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized: Admin access required" 
      });
    }

    if (err.code?.startsWith('P')) {
      // Prisma error handling
      console.error("Prisma error details:", err);
      
      if (err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: "Duplicate entry conflict",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (err.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: "Record not found",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: "Database error", 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Line 720: Utility function to get last reminder time
async function getLastReminderTime() {
  try {
    const lastReminder = await prisma.reminder.findFirst({
      orderBy: { sentAt: 'desc' },
      select: { sentAt: true }
    });
    return lastReminder?.sentAt || null;
  } catch (error) {
    console.error("Error getting last reminder time:", error);
    return null;
  }
}