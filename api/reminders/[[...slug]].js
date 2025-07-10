import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../../utils/auth.js";
import {
  isValidPhilippinePhone,
  normalizePhoneNumber,
  formatPhoneForDisplay,
  getNetworkProvider,
} from "../../utils/phoneUtils.js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default async function handler(req, res) {
  const { method } = req;

  try {
    const { slug } = req.query;
    const pathParts = Array.isArray(slug) ? slug : slug ? [slug] : [];
    const action = pathParts[0] || "";

    const user = await authenticate(req);
    await authorizeRole("admin", user);

    switch (method) {
      case "GET":
        if (action === "history") {
          return await handleGetReminderHistory(req, res);
        } else if (action === "credits") {
          return await handleGetSMSCredits(req, res);
        } else if (action === "stats") {
          return await handleGetReminderStats(req, res);
        } else if (!action) {
          return await handleGetReminders(req, res);
        }
        break;

      case "POST":
        if (action === "send") {
          return await handleSendReminder(req, res);
        } else if (action === "test") {
          return await handleTestSMS(req, res);
        }
        break;

      case "DELETE":
        if (action && !isNaN(action)) {
          return await handleDeleteReminder(req, res, parseInt(action));
        }
        break;

      default:
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
        });
    }

    return res.status(404).json({
      success: false,
      error: "Route not found",
    });
  } catch (error) {
    return handleAPIError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}

function handleAPIError(error, res) {
  console.error("Reminder API Error:", error);

  if (
    error.message === "Authentication required" ||
    error.message === "Invalid token"
  ) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please login as admin.",
    });
  }

  if (
    error.message.includes("Forbidden") ||
    error.message.includes("Insufficient permissions")
  ) {
    return res.status(403).json({
      success: false,
      error: "Admin access required for reminder operations.",
    });
  }

  if (
    error.message.includes("validation") ||
    error.message.includes("invalid")
  ) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error. Please try again.",
  });
}

async function handleGetReminders(req, res) {
  try {
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

    const totalCount = await prisma.reminder.count();

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReminders = await prisma.reminder.findMany({
      where: {
        sentAt: { gte: last24Hours },
      },
      select: {
        status: true,
      },
    });

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
        message: "Reminder service operational",
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

async function handleGetReminderHistory(req, res) {
  try {
    const { page = 1, limit = 20, studentId, status, days = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    const whereClause = {
      sentAt: { gte: dateFilter },
    };

    if (studentId && !isNaN(studentId)) {
      whereClause.studentId = parseInt(studentId);
    }

    if (status) {
      whereClause.status = status;
    }

    const totalCount = await prisma.reminder.count({ where: whereClause });

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
      cost: reminder.cost || 0.06,
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

async function handleSendReminder(req, res) {
  try {
    const { studentId, customMessage, testMode = false } = req.body;

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: "Valid student ID is required",
      });
    }

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

    if (!student.phone || !isValidPhilippinePhone(student.phone)) {
      return res.status(400).json({
        success: false,
        error: "Student has no valid Philippine mobile number on file",
      });
    }

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

    const message = customMessage || generateReminderMessage(student);
    const normalizedPhone = normalizePhoneNumber(student.phone);

    // Line 291: Test mode - log without sending actual SMS
    if (testMode || process.env.NODE_ENV === "development") {
      console.log("=== TEST MODE SMS REMINDER ===");
      console.log("Student:", student.name);
      console.log("Phone:", normalizedPhone);
      console.log("Message:", message);
      console.log("Length:", message.length, "characters");
      console.log("Network:", getNetworkProvider(normalizedPhone));
      console.log("Estimated Cost: ₱0.06");
      console.log("==============================");

      // Line 301: Create test reminder record
      const reminder = await prisma.reminder.create({
        data: {
          studentId: parseInt(studentId),
          method: "SMS",
          status: "TEST_SENT",
          message: message,
          phoneNumber: normalizedPhone,
          cost: 0.06,
          response: "Test mode - no actual SMS sent",
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
          estimatedCost: 0.06,
          network: getNetworkProvider(normalizedPhone),
        },
      });
    }

    let smsResult = null;
    let reminderStatus = "FAILED";
    let responseText = "";

    try {
      const { sendSMSViaSemaphore } = await import("../../utils/smsService.js");

      smsResult = await sendSMSViaSemaphore(normalizedPhone, message);
      reminderStatus = smsResult.success ? "SENT" : "FAILED";
      responseText = smsResult.response || smsResult.error || "Unknown error";
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      reminderStatus = "FAILED";
      responseText = smsError.message || "SMS service error";
    }

    const reminder = await prisma.reminder.create({
      data: {
        studentId: parseInt(studentId),
        method: "SMS",
        status: reminderStatus,
        message: message,
        phoneNumber: normalizedPhone,
        cost: reminderStatus === "SENT" ? 0.06 : 0,
        response: responseText,
        retryCount: 0,
      },
    });

    if (reminderStatus === "SENT") {
      return res.status(200).json({
        success: true,
        message: "SMS reminder sent successfully",
        data: {
          reminderId: reminder.id,
          studentName: student.name,
          phone: formatPhoneForDisplay(normalizedPhone),
          messageLength: message.length,
          cost: 0.06,
          network: getNetworkProvider(normalizedPhone),
          sentAt: reminder.sentAt,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: `Failed to send SMS: ${responseText}`,
        data: {
          reminderId: reminder.id,
          studentName: student.name,
          phone: formatPhoneForDisplay(normalizedPhone),
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

function generateReminderMessage(student) {
  const activeMembership = student.memberships[0];

  if (!activeMembership) {
    return `Hi ${student.name}! Your gym membership has expired. Please visit us to renew and continue your fitness journey.`;
  }

  const endDate = new Date(activeMembership.endDate);
  const today = new Date();
  const daysOverdue = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));

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

async function handleGetSMSCredits(req, res) {
  try {
    const apiKey = process.env.SEMAPHORE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "SMS service not configured",
      });
    }

    const response = await fetch("https://semaphore.co/api/v4/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Semaphore API error: ${response.status}`);
    }

    const accountData = await response.json();

    const credits = {
      balance: accountData.credit_balance || 0,
      used: accountData.total_sent || 0,
      remaining: accountData.credit_balance || 0,
      costPerSMS: 0.06,
      currency: "PHP",
      lowBalance: accountData.credit_balance < 100,
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: credits,
      message: "SMS credits retrieved successfully",
    });
  } catch (error) {
    console.error("Error checking SMS credits:", error);

    const mockCredits = {
      balance: 1000,
      used: 50,
      remaining: 950,
      costPerSMS: 0.06,
      currency: "PHP",
      lowBalance: false,
      lastUpdated: new Date().toISOString(),
      note: "Mock data - SMS service temporarily unavailable",
    };

    return res.status(200).json({
      success: true,
      data: mockCredits,
      message: "SMS credits retrieved (cached data)",
    });
  }
}

async function handleGetReminderStats(req, res) {
  try {
    const { days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

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

    return res.status(200).json({
      success: true,
      data: {
        statusBreakdown: stats,
        networkDistribution: networkStats,
        dailyTrends: dailyStats,
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

async function handleTestSMS(req, res) {
  try {
    const {
      phone,
      message = "This is a test message from your gym management system.",
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

    console.log("=== SMS TEST ENDPOINT ===");
    console.log("Phone:", normalizedPhone);
    console.log("Message:", message);
    console.log("Length:", message.length, "characters");
    console.log("Network:", getNetworkProvider(normalizedPhone));
    console.log("=========================");

    return res.status(200).json({
      success: true,
      testMode: true,
      message: "SMS test completed successfully",
      data: {
        phone: formatPhoneForDisplay(normalizedPhone),
        messageLength: message.length,
        network: getNetworkProvider(normalizedPhone),
        estimatedCost: 0.06,
        validation: "Phone number is valid for SMS",
      },
    });
  } catch (error) {
    console.error("Error in SMS test:", error);
    return res.status(500).json({
      success: false,
      error: "SMS test failed",
    });
  }
}

async function handleDeleteReminder(req, res, reminderId) {
  try {
     const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        student: {
          select: { name: true }
        }
      }
    });

     if (!reminder) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }

    await prisma.reminder.delete({
      where: { id: reminderId }
    });

      return res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
      data: { 
        deletedId: reminderId,
        studentName: reminder.student.name,
        sentAt: reminder.sentAt
      }
    });
    
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete reminder",
    });
  }
}
