// Line 1: Import required dependencies for SMS reminder system
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../../utils/auth.js";
import {
  isValidPhilippinePhone,
  normalizePhoneNumber,
  formatPhoneForDisplay,
  getNetworkProvider,
} from "../../utils/phoneUtils.js";

// Line 10: Initialize Prisma client - follows existing codebase pattern
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Line 18: Main API handler function - matches existing [[...slug]].js pattern
export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Extract path parts after "/api/reminders" - same pattern as payments API
  const parts = pathname.split("/").filter(Boolean);
  const remindersIndex = parts.indexOf("reminders");
  const pathParts = remindersIndex !== -1 ? parts.slice(remindersIndex + 1) : [];
  const action = pathParts[0] || "";

  console.log("🔥 Reminders API hit");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);
  console.log("METHOD:", method);

  try {
    // Line 28: Authenticate and authorize admin access
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Line 32: GET /api/reminders - Basic reminder statistics
    if (method === "GET" && pathParts.length === 0) {
      return await handleGetReminders(req, res);
    }

    // Line 36: GET /api/reminders/history - Get reminder history with pagination
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "history") {
      return await handleGetReminderHistory(req, res);
    }

    // Line 40: GET /api/reminders/credits - Check SMS credit balance
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "credits") {
      return await handleGetSMSCredits(req, res);
    }

    // Line 44: GET /api/reminders/stats - Get detailed reminder statistics
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "stats") {
      return await handleGetReminderStats(req, res);
    }

    // Line 48: POST /api/reminders/send - Send SMS reminder to student
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "send") {
      return await handleSendReminder(req, res);
    }

    // Line 52: POST /api/reminders/test - Test SMS functionality
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "test") {
      return await handleTestSMS(req, res);
    }

    // Line 56: DELETE /api/reminders/:id - Delete specific reminder
    if (method === "DELETE" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      return await handleDeleteReminder(req, res, parseInt(pathParts[0]));
    }

    // Line 60: Unsupported route handler with helpful error message
    return res.status(404).json({
      success: false,
      error: "Route not found",
      availableRoutes: [
        "GET /api/reminders",
        "GET /api/reminders/history",
        "GET /api/reminders/credits", 
        "GET /api/reminders/stats",
        "POST /api/reminders/send",
        "POST /api/reminders/test",
        "DELETE /api/reminders/:id"
      ]
    });

  } catch (error) {
    return handleAPIError(error, res);
  } finally {
    // Line 71: Ensure database connection is properly closed
    await prisma.$disconnect();
  }
}

// Line 75: Function to handle authentication and authorization errors
function handleAPIError(error, res) {
  console.error("Reminder API Error:", error);

  // Line 79: Handle authentication errors
  if (
    error.message === "Authentication required" ||
    error.message === "Invalid token"
  ) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please login as admin.",
    });
  }

  // Line 86: Handle authorization errors  
  if (
    error.message.includes("Forbidden") ||
    error.message.includes("Insufficient permissions")
  ) {
    return res.status(403).json({
      success: false,
      error: "Admin access required for reminder operations.",
    });
  }

  // Line 93: Handle validation errors
  if (
    error.message.includes("validation") ||
    error.message.includes("invalid")
  ) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  // Line 100: Handle generic server errors
  return res.status(500).json({
    success: false,
    error: "Internal server error. Please try again.",
  });
}

// Line 106: Function to get basic reminder statistics for dashboard
async function handleGetReminders(req, res) {
  try {
    // Line 109: Get today's reminder count for dashboard display
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

    // Line 122: Get total reminder count for overview
    const totalCount = await prisma.reminder.count();

    // Line 125: Get recent reminder status summary
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReminders = await prisma.reminder.findMany({
      where: {
        sentAt: { gte: last24Hours },
      },
      select: {
        status: true,
      },
    });

    // Line 135: Calculate status distribution
    const statusCounts = recentReminders.reduce((acc, reminder) => {
      acc[reminder.status] = (acc[reminder.status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        todayCount,
        totalCount,
        last24HoursCount: recentReminders.length,
        statusDistribution: statusCounts,
        message: "PhilSMS reminder service operational",
        provider: "PhilSMS",
        costPerSMS: 0.35
      },
    });
  } catch (error) {
    console.error("Error getting reminder statistics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve reminder statistics",
    });
  }
}

// Line 157: Function to get detailed reminder history with student information
async function handleGetReminderHistory(req, res) {
  try {
    // Line 160: Extract query parameters for pagination and filtering
    const { page = 1, limit = 20, studentId, status, days = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Line 164: Build date filter for recent reminders
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    // Line 168: Build where clause with optional filters
    const whereClause = {
      sentAt: { gte: dateFilter },
    };

    if (studentId && !isNaN(studentId)) {
      whereClause.studentId = parseInt(studentId);
    }

    if (status) {
      whereClause.status = status;
    }

    // Line 179: Get total count for pagination
    const totalCount = await prisma.reminder.count({ where: whereClause });

    // Line 182: Fetch reminders with student details
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
      orderBy: { sentAt: "desc" },
      take: parseInt(limit),
      skip: offset,
    });

    // Line 197: Format reminders for response
    const formattedReminders = reminders.map((reminder) => ({
      id: reminder.id,
      studentId: reminder.studentId,
      studentName: reminder.student.name,
      phone: formatPhoneForDisplay(
        reminder.phoneNumber || reminder.student.phone
      ),
      method: reminder.method,
      status: reminder.status,
      message:
        reminder.message?.substring(0, 100) +
        (reminder.message?.length > 100 ? "..." : ""),
      cost: reminder.cost || 0.35, // Updated for PhilSMS cost
      sentAt: reminder.sentAt,
      response: reminder.response,
      retryCount: reminder.retryCount || 0,
      network: getNetworkProvider(
        reminder.phoneNumber || reminder.student.phone
      ),
    }));

    return res.status(200).json({
      success: true,
      data: {
        reminders: formattedReminders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
        summary: {
          totalReminders: totalCount,
          dateRange: `Last ${days} days`,
          filters: { studentId, status },
          provider: "PhilSMS",
          avgCostPerSMS: 0.35
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reminder history:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch reminder history",
    });
  }
}

// Line 235: Function to send SMS reminder to student (UPDATED FOR PHILSMS)
async function handleSendReminder(req, res) {
  try {
    // Line 238: Extract and validate request body
    const { studentId, customMessage, testMode = false } = req.body;

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: "Valid student ID is required",
      });
    }

    // Line 247: Fetch student with membership and recent reminder data
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
      });
    }

    // Line 271: Validate phone number
    if (!student.phone || !isValidPhilippinePhone(student.phone)) {
      return res.status(400).json({
        success: false,
        error: "Student has no valid Philippine mobile number on file",
      });
    }

    // Line 279: Check rate limiting (24-hour cooldown)
    if (student.reminders.length > 0) {
      const lastReminder = student.reminders[0];
      const timeSinceLastReminder =
        Date.now() - new Date(lastReminder.sentAt).getTime();
      const hoursLeft = Math.ceil(
        (24 * 60 * 60 * 1000 - timeSinceLastReminder) / (60 * 60 * 1000)
      );

      if (timeSinceLastReminder < 24 * 60 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: `Rate limited. Can send another reminder in ${hoursLeft} hours.`,
        });
      }
    }

    // Line 291: Generate reminder message
    const message = customMessage || generateReminderMessage(student);
    const normalizedPhone = normalizePhoneNumber(student.phone);

    // Line 295: Test mode - log without sending actual SMS
    if (testMode || process.env.NODE_ENV === "development") {
      console.log("=== TEST MODE SMS REMINDER ===");
      console.log("Student:", student.name);
      console.log("Phone:", normalizedPhone);
      console.log("Message:", message);
      console.log("Length:", message.length, "characters");
      console.log("Network:", getNetworkProvider(normalizedPhone));
      console.log("Provider: PhilSMS");
      console.log("Estimated Cost: ₱0.35 (42% cheaper!)");
      console.log("==============================");

      // Line 306: Create test reminder record
      const reminder = await prisma.reminder.create({
        data: {
          studentId: parseInt(studentId),
          method: "SMS",
          status: "TEST_SENT",
          message: message,
          phoneNumber: normalizedPhone,
          cost: 0.35, // Updated for PhilSMS cost
          response: "Test mode - no actual SMS sent via PhilSMS",
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
          estimatedCost: 0.35,
          network: getNetworkProvider(normalizedPhone),
          provider: "PhilSMS",
          savings: "42% cheaper than Semaphore"
        },
      });
    }

    // Line 331: Production mode - attempt to send actual SMS via PhilSMS
    let smsResult = null;
    let reminderStatus = "FAILED";
    let responseText = "";

    try {
      // Line 336: Import PhilSMS service dynamically to avoid import errors in test mode
      const { sendSMSViaPhilSMS } = await import("../../utils/smsService.js");

      smsResult = await sendSMSViaPhilSMS(normalizedPhone, message);
      reminderStatus = smsResult.success ? "SENT" : "FAILED";
      responseText = smsResult.response || smsResult.error || "Unknown error";
    } catch (smsError) {
      console.error("PhilSMS sending failed:", smsError);
      reminderStatus = "FAILED";
      responseText = smsError.message || "PhilSMS service error";
    }

    // Line 347: Create reminder record with actual results
    const reminder = await prisma.reminder.create({
      data: {
        studentId: parseInt(studentId),
        method: "SMS",
        status: reminderStatus,
        message: message,
        phoneNumber: normalizedPhone,
        cost: reminderStatus === "SENT" ? 0.35 : 0, // Updated for PhilSMS cost
        response: responseText,
        retryCount: 0,
      },
    });

    // Line 360: Return response based on SMS result
    if (reminderStatus === "SENT") {
      return res.status(200).json({
        success: true,
        message: "SMS reminder sent successfully via PhilSMS",
        data: {
          reminderId: reminder.id,
          studentName: student.name,
          phone: formatPhoneForDisplay(normalizedPhone),
          messageLength: message.length,
          cost: 0.35,
          network: getNetworkProvider(normalizedPhone),
          sentAt: reminder.sentAt,
          provider: "PhilSMS",
          savings: "₱0.25 saved vs Semaphore"
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: `Failed to send SMS via PhilSMS: ${responseText}`,
        data: {
          reminderId: reminder.id,
          studentName: student.name,
          phone: formatPhoneForDisplay(normalizedPhone),
          provider: "PhilSMS"
        },
      });
    }
  } catch (error) {
    console.error("Error in handleSendReminder:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process reminder request",
    });
  }
}

// Line 389: Function to generate context-aware reminder messages
function generateReminderMessage(student) {
  const activeMembership = student.memberships[0];

  if (!activeMembership) {
    return `Hi ${student.name}! Your gym membership has expired. Please visit us to renew and continue your fitness journey.`;
  }

  // Line 396: Calculate days overdue
  const endDate = new Date(activeMembership.endDate);
  const today = new Date();
  const daysOverdue = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));

  // Line 401: Generate message based on overdue period
  if (daysOverdue <= 3) {
    return `Hi ${student.name}! Your gym membership expired ${daysOverdue} day(s) ago. Please renew soon to avoid service interruption. Thank you!`;
  } else if (daysOverdue <= 7) {
    return `Hi ${student.name}! Your membership has been overdue for ${daysOverdue} days. Please renew to continue accessing our facilities.`;
  } else if (daysOverdue <= 14) {
    return `Hi ${student.name}! Your membership expired ${daysOverdue} days ago. Please visit us to renew and restore your access immediately.`;
  } else {
    return `Hi ${student.name}! Your membership has been expired for ${daysOverdue} days. Please contact us to discuss renewal options.`;
  }
}

// Line 1: Fixed SMS Credits API Handler - api/reminders/[[...slug]].js
// Removes mock data fallback and properly handles PhilSMS API integration

// Line 275: Enhanced function to check SMS credits balance via PhilSMS API
async function handleGetSMSCredits(req, res) {
  try {
    const apiKey = process.env.PHILSMS_API_KEY;

    // Line 279: Return actual zero balance when no API key is configured
    if (!apiKey) {
      console.log("⚠️ No PhilSMS API key configured - returning zero balance");
      
      const noApiKeyCredits = {
        balance: 0,
        used: 0,
        remaining: 0,
        costPerSMS: 0.35,
        currency: "PHP",
        lowBalance: true,
        lastUpdated: new Date().toISOString(),
        messagesRemaining: 0,
        provider: "PhilSMS",
        note: "SMS service not configured. Add PHILSMS_API_KEY to environment variables for real balance."
      };

      return res.status(200).json({
        success: true,
        data: noApiKeyCredits,
        message: "SMS service not configured",
        warning: "Configure PHILSMS_API_KEY for SMS functionality"
      });
    }

    // Line 299: Import PhilSMS service to check actual credits
    const { checkSMSCredits } = await import("../../utils/smsService.js");
    const creditsResult = await checkSMSCredits();

    if (creditsResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          ...creditsResult.data,
          provider: "PhilSMS",
          savingsVsSemaphore: "42%"
        },
        message: "PhilSMS credits retrieved successfully",
      });
    } else {
      // Line 313: Return zero balance data if API fails instead of mock data
      const apiFailureCredits = {
        balance: 0,
        used: 0,
        remaining: 0,
        costPerSMS: 0.35,
        currency: "PHP",
        lowBalance: true,
        lastUpdated: new Date().toISOString(),
        messagesRemaining: 0,
        provider: "PhilSMS",
        note: "Unable to fetch current balance - PhilSMS service temporarily unavailable",
        error: creditsResult.error
      };

      return res.status(200).json({
        success: true,
        data: apiFailureCredits,
        message: "SMS credits unavailable",
        warning: "PhilSMS service temporarily unavailable"
      });
    }
  } catch (error) {
    console.error("Error checking PhilSMS credits:", error);

    // Line 337: Return zero balance on error instead of mock data
    return res.status(500).json({
      success: false,
      error: "Failed to check SMS credits",
      data: {
        balance: 0,
        used: 0,
        remaining: 0,
        costPerSMS: 0.35,
        currency: "PHP",
        lowBalance: true,
        lastUpdated: new Date().toISOString(),
        messagesRemaining: 0,
        provider: "PhilSMS",
        note: "SMS service error occurred"
      }
    });
  }
}

// Line 479: Function to get detailed reminder statistics for analytics
async function handleGetReminderStats(req, res) {
  try {
    const { days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    // Line 485: Get comprehensive statistics
    const stats = await prisma.reminder.groupBy({
      by: ["status"],
      where: {
        sentAt: { gte: dateFilter },
      },
      _count: {
        status: true,
      },
      _sum: {
        cost: true,
      },
    });

    // Line 497: Get network provider distribution
    const networkStats = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN "phoneNumber" LIKE '+639%' THEN 
            CASE 
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('905', '906', '915', '916', '917', '926', '927', '935', '936', '937', '945', '953', '954', '955', '956', '965', '966', '967', '975', '976', '977', '978', '979', '995', '996', '997') THEN 'Globe'
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('908', '909', '910', '911', '912', '913', '914', '918', '919', '920', '921', '922', '923', '924', '925', '928', '929', '930', '931', '932', '933', '934', '938', '939', '940', '941', '942', '943', '944', '946', '947', '948', '949', '950', '951', '970', '971', '972', '973', '974', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '992', '993', '994', '998', '999') THEN 'Smart'
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('895', '896', '897', '898', '991') THEN 'DITO'
              ELSE 'Unknown'
            END
          ELSE 'Invalid'
        END as network,
        COUNT(*) as count,
        SUM(cost) as totalCost
      FROM "Reminder" 
      WHERE "sentAt" >= ${dateFilter}
      GROUP BY 
        CASE 
          WHEN "phoneNumber" LIKE '+639%' THEN 
            CASE 
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('905', '906', '915', '916', '917', '926', '927', '935', '936', '937', '945', '953', '954', '955', '956', '965', '966', '967', '975', '976', '977', '978', '979', '995', '996', '997') THEN 'Globe'
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('908', '909', '910', '911', '912', '913', '914', '918', '919', '920', '921', '922', '923', '924', '925', '928', '929', '930', '931', '932', '933', '934', '938', '939', '940', '941', '942', '943', '944', '946', '947', '948', '949', '950', '951', '970', '971', '972', '973', '974', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '992', '993', '994', '998', '999') THEN 'Smart'
              WHEN SUBSTRING("phoneNumber" FROM 4 FOR 3) IN ('895', '896', '897', '898', '991') THEN 'DITO'
              ELSE 'Unknown'
            END
          ELSE 'Invalid'
        END
      ORDER BY count DESC
    `;

    // Line 522: Get daily reminder trends
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("sentAt") as date,
        COUNT(*) as count,
        SUM(cost) as "totalCost",
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
      FROM "Reminder" 
      WHERE "sentAt" >= ${dateFilter}
      GROUP BY DATE("sentAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    // Line 535: Calculate total cost savings compared to Semaphore
    const totalCost = stats.reduce((sum, stat) => sum + (stat._sum.cost || 0), 0);
    const estimatedSemaphoreCost = totalCost / 0.35 * 0.60; // What it would cost with Semaphore
    const savings = estimatedSemaphoreCost - totalCost;

    return res.status(200).json({
      success: true,
      data: {
        statusBreakdown: stats,
        networkDistribution: networkStats,
        dailyTrends: dailyStats,
        costAnalysis: {
          totalCost: totalCost,
          estimatedSemaphoreCost: estimatedSemaphoreCost,
          savings: savings,
          savingsPercentage: Math.round((savings / estimatedSemaphoreCost) * 100),
          provider: "PhilSMS"
        },
        period: `Last ${days} days`,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting reminder statistics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve reminder statistics",
    });
  }
}

// Line 560: Function to test SMS functionality safely
async function handleTestSMS(req, res) {
  try {
    const {
      phone,
      message = "This is a test message from your gym management system via PhilSMS.",
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required for testing",
      });
    }
    if (!isValidPhilippinePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Philippine phone number format",
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Line 578: Always use test mode for this endpoint
    console.log("=== PHILSMS TEST ENDPOINT ===");
    console.log("Phone:", normalizedPhone);
    console.log("Message:", message);
    console.log("Length:", message.length, "characters");
    console.log("Network:", getNetworkProvider(normalizedPhone));
    console.log("Provider: PhilSMS");
    console.log("Cost: ₱0.35 (vs ₱0.60 Semaphore)");
    console.log("=========================");

    return res.status(200).json({
      success: true,
      testMode: true,
      message: "PhilSMS test completed successfully",
      data: {
        phone: formatPhoneForDisplay(normalizedPhone),
        messageLength: message.length,
        network: getNetworkProvider(normalizedPhone),
        estimatedCost: 0.35,
        provider: "PhilSMS",
        savings: "42% cheaper than Semaphore",
        validation: "Phone number is valid for SMS",
      },
    });
  } catch (error) {
    console.error("Error in PhilSMS test:", error);
    return res.status(500).json({
      success: false,
      error: "PhilSMS test failed",
    });
  }
}

// Line 608: Function to delete reminder record (admin cleanup)
async function handleDeleteReminder(req, res, reminderId) {
  try {
    // Line 611: Verify reminder exists
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        student: {
          select: { name: true },
        },
      },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: "Reminder not found",
      });
    }

    // Line 625: Delete the reminder
    await prisma.reminder.delete({
      where: { id: reminderId },
    });

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully",
      data: {
        deletedId: reminderId,
        studentName: reminder.student.name,
        sentAt: reminder.sentAt,
        provider: "PhilSMS"
      },
    });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete reminder",
    });
  }
}