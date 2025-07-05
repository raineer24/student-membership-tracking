// Line 1: Payment API with enhanced membership integration and atomic transactions
import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

// Line 5: Main API handler with comprehensive routing
export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Extract path parts after "/api/payments"
  const parts = pathname.split("/").filter(Boolean);
  const paymentsIndex = parts.indexOf("payments");
  const pathParts = paymentsIndex !== -1 ? parts.slice(paymentsIndex + 1) : [];

  console.log("🔥 Payments API hit");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);
  console.log("METHOD:", method);
  console.log("BODY:", req.body);

  try {
    const user = await authenticate(req);

    // Line 24: GET /api/payments – List all payments with enhanced filtering
    if (method === "GET" && pathParts.length === 0) {
      await authorizeRole("ADMIN", user);

      const payments = await prisma.payment.findMany({
        include: { 
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { paidAt: 'desc' }
      });

      return res.status(200).json({
        success: true,
        count: payments.length,
        payments
      });
    }

    // Line 46: GET /api/payments/:id – Get specific payment details
    if (method === "GET" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { 
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              memberships: {
                orderBy: { endDate: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      return payment
        ? res.status(200).json({ success: true, payment })
        : res.status(404).json({ success: false, error: "Payment not found" });
    }

    // Line 72: POST /api/payments/create – Enhanced payment creation with atomic membership extension
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "create") {
      await authorizeRole("ADMIN", user);

      const { 
        studentId, 
        amount, 
        method = "CASH", 
        description = "", 
        extendMembership = true,
        membershipType = "MONTHLY"
      } = req.body;

      // Line 83: Comprehensive input validation
      if (!studentId || !amount) {
        return res.status(400).json({ 
          success: false, 
          error: "Student ID and amount are required" 
        });
      }

      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Amount must be a positive number" 
        });
      }

      const validMethods = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "CHECK", "OTHER"];
      if (!validMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}`
        });
      }

      const validMembershipTypes = ["MONTHLY", "YEARLY"];
      if (extendMembership && !validMembershipTypes.includes(membershipType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid membership type. Must be one of: ${validMembershipTypes.join(", ")}`
        });
      }

      // Line 109: Verify student exists and get current membership data
      const student = await prisma.student.findUnique({
        where: { id: Number(studentId) },
        include: { 
          memberships: {
            orderBy: { endDate: 'desc' }
          }
        }
      });

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          error: "Student not found" 
        });
      }

      // Line 123: Membership pricing validation
      const membershipPrices = {
        MONTHLY: 1400,
        YEARLY: 16800
      };

      if (extendMembership) {
        const expectedAmount = membershipPrices[membershipType];
        if (parseFloat(amount) !== expectedAmount) {
          return res.status(400).json({
            success: false,
            error: `${membershipType} membership must be exactly ₱${expectedAmount}. Received: ₱${amount}`
          });
        }
      }

      // Line 138: Atomic transaction - payment creation with membership extension
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const paymentData = {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          method: method || "CASH",
          description: description || `${membershipType} membership payment`,
          status: "COMPLETED",
          paidAt: new Date()
        };

        console.log("Creating payment with data:", paymentData);

        const newPayment = await tx.payment.create({
          data: paymentData,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        });

        console.log("Payment created:", newPayment);

        let membershipResult = null;

        // Line 165: Handle membership extension if requested
        if (extendMembership) {
          try {
            // Find the most recent membership
            let latestMembership = await tx.membership.findFirst({
              where: { studentId: Number(studentId) },
              orderBy: { endDate: 'desc' }
            });

            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            // Line 176: Calculate membership dates based on existing membership
            if (latestMembership) {
              const membershipEndDate = new Date(latestMembership.endDate);
              
              // If current membership is still active, extend from end date
              // If expired, start from today
              startDate = membershipEndDate > now ? membershipEndDate : now;
            } else {
              // New member - start from today
              startDate = now;
            }

            // Calculate end date based on membership type
            const durationDays = membershipType === "YEARLY" ? 365 : 30;
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + durationDays);

            // Line 192: Create new membership record (fixed schema compatibility)
            const membershipData = {
              studentId: Number(studentId),
              type: membershipType,
              startDate: startDate,
              endDate: endDate,
              isActive: true,
              overdue: false
            };

            console.log("Creating membership with data:", membershipData);

            membershipResult = await tx.membership.create({
              data: membershipData
            });

            console.log("Membership created:", membershipResult);

          } catch (membershipError) {
            console.error("Membership creation failed:", membershipError);
            throw new Error(`Membership extension failed: ${membershipError.message}`);
          }
        }

        // Return both payment and membership data
        return {
          payment: newPayment,
          membership: membershipResult,
          membershipExtended: !!membershipResult
        };
      });

      // Line 218: Enhanced response with complete transaction details
      const response = {
        success: true,
        message: "Payment processed successfully",
        payment: result.payment,
        student: result.payment.student,
        membershipExtended: result.membershipExtended,
        amount: parseFloat(amount),
        method: method
      };

      if (result.membership) {
        response.membership = {
          id: result.membership.id,
          type: result.membership.type,
          startDate: result.membership.startDate,
          endDate: result.membership.endDate,
          isActive: result.membership.isActive,
          overdue: result.membership.overdue
        };
        response.endDate = result.membership.endDate;
      }

      console.log("Sending response:", response);
      
      return res.status(201).json(response);
    }

    // Line 241: PUT /api/payments/:id – Update existing payment
    if (method === "PUT" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      const { amount, method, description, status } = req.body;

      // Check if payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id }
      });

      if (!existingPayment) {
        return res.status(404).json({ 
          success: false, 
          error: "Payment not found" 
        });
      }

      // Prepare update data
      const updateData = {};
      if (amount !== undefined) {
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
          return res.status(400).json({
            success: false,
            error: "Amount must be a positive number"
          });
        }
        updateData.amount = parseFloat(amount);
      }

      if (method !== undefined) {
        const validMethods = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "CHECK", "OTHER"];
        if (!validMethods.includes(method)) {
          return res.status(400).json({
            success: false,
            error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}`
          });
        }
        updateData.method = method;
      }

      if (description !== undefined) updateData.description = description;
      if (status !== undefined) {
        const validStatuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
          });
        }
        updateData.status = status;
      }

      updateData.updatedAt = new Date();

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: updateData,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        payment: updatedPayment
      });
    }

    // Line 304: DELETE /api/payments/:id – Delete payment (admin only)
    if (method === "DELETE" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);

      const existingPayment = await prisma.payment.findUnique({
        where: { id }
      });

      if (!existingPayment) {
        return res.status(404).json({ 
          success: false, 
          error: "Payment not found" 
        });
      }

      await prisma.payment.delete({ where: { id } });
      
      return res.status(200).json({
        success: true,
        message: "Payment deleted successfully"
      });
    }

    // Line 327: GET /api/payments/student/:studentId – Get payments for specific student
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "student" && !isNaN(Number(pathParts[1]))) {
      await authorizeRole("ADMIN", user);

      const studentId = Number(pathParts[1]);

      const payments = await prisma.payment.findMany({
        where: { studentId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { paidAt: 'desc' }
      });

      return res.status(200).json({
        success: true,
        count: payments.length,
        studentId,
        payments
      });
    }

    // Line 353: GET /api/payments/stats – Payment statistics and analytics
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "stats") {
      await authorizeRole("ADMIN", user);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const [
        totalPayments, 
        monthlyPayments, 
        yearlyPayments, 
        totalRevenue, 
        monthlyRevenue, 
        yearlyRevenue,
        recentPayments
      ] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({
          where: { paidAt: { gte: startOfMonth } }
        }),
        prisma.payment.count({
          where: { paidAt: { gte: startOfYear } }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { paidAt: { gte: startOfMonth } }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { paidAt: { gte: startOfYear } }
        }),
        prisma.payment.findMany({
          take: 10,
          orderBy: { paidAt: 'desc' },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalPayments,
          monthlyPayments,
          yearlyPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          yearlyRevenue: yearlyRevenue._sum.amount || 0,
          recentPayments
        }
      });
    }

    // Line 407: GET /api/payments/verify/:paymentId – Verify payment and membership status
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "verify" && !isNaN(Number(pathParts[1]))) {
      await authorizeRole("ADMIN", user);

      const paymentId = Number(pathParts[1]);

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: {
            include: {
              memberships: {
                orderBy: { endDate: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: "Payment not found"
        });
      }

      // Check if payment amount matches any recent membership
      const paymentDate = new Date(payment.paidAt);
      const matchingMembership = payment.student.memberships.find(m => {
        const membershipDate = new Date(m.startDate);
        const timeDiff = Math.abs(membershipDate - paymentDate);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        // Match memberships created within 1 day of payment
        return daysDiff <= 1;
      });

      return res.status(200).json({
        success: true,
        payment,
        membershipFound: !!matchingMembership,
        membership: matchingMembership || null,
        student: payment.student
      });
    }

    // Line 447: Unsupported route handler with helpful error message
    return res.status(404).json({ 
      success: false, 
      error: "Route not found",
      availableRoutes: [
        "GET /api/payments",
        "GET /api/payments/:id",
        "POST /api/payments/create",
        "PUT /api/payments/:id",
        "DELETE /api/payments/:id",
        "GET /api/payments/student/:studentId",
        "GET /api/payments/stats",
        "GET /api/payments/verify/:paymentId"
      ]
    });

  } catch (err) {
    console.error("❌ Payments API ERROR:", err);
    
    // Line 464: Comprehensive error handling with proper HTTP status codes
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