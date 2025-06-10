import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

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

    // ✅ GET /api/payments – List all payments
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

    // ✅ GET /api/payments/:id
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
              phone: true
            }
          }
        }
      });

      return payment
        ? res.status(200).json({ success: true, payment })
        : res.status(404).json({ success: false, error: "Payment not found" });
    }

    // ✅ POST /api/payments/create - Enhanced with membership extension
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

      // Validation
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

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: Number(studentId) },
        include: { memberships: true }
      });

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          error: "Student not found" 
        });
      }

      // Create payment with enhanced data
      const paymentData = {
        studentId: Number(studentId),
        amount: parseFloat(amount),
        method: method || "CASH",
        description: description || `${membershipType} membership payment`,
        status: "COMPLETED", // Assuming immediate completion for cash/direct payments
        paidAt: new Date()
      };

      console.log("Creating payment with data:", paymentData);

      const newPayment = await prisma.payment.create({
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

      // Handle membership extension if requested
      let membershipResult = null;
      if (extendMembership) {
        try {
          // Find the most recent membership
          let membership = await prisma.membership.findFirst({
            where: { studentId: Number(studentId) },
            orderBy: { endDate: 'desc' }
          });

          const now = new Date();
          let newEndDate = new Date();

          if (membership) {
            // Extend existing membership
            const membershipEndDate = new Date(membership.endDate);
            const baseDate = membershipEndDate > now ? membershipEndDate : now;
            
            if (membershipType === "YEARLY") {
              newEndDate = new Date(baseDate);
              newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            } else {
              // Default to MONTHLY
              newEndDate = new Date(baseDate);
              newEndDate.setMonth(newEndDate.getMonth() + 1);
            }

            membershipResult = await prisma.membership.update({
              where: { id: membership.id },
              data: { 
                endDate: newEndDate,
                type: membershipType,
                isActive: true,
                overdue: false
              }
            });

            console.log("Membership extended:", membershipResult);
          } else {
            // Create new membership
            if (membershipType === "YEARLY") {
              newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            } else {
              newEndDate.setMonth(newEndDate.getMonth() + 1);
            }

            membershipResult = await prisma.membership.create({
              data: {
                studentId: Number(studentId),
                startDate: now,
                endDate: newEndDate,
                type: membershipType,
                isActive: true,
                overdue: false
              }
            });

            console.log("New membership created:", membershipResult);
          }
        } catch (membershipError) {
          console.error("Error handling membership:", membershipError);
          // Don't fail the payment if membership extension fails
          // Just log the error and continue
        }
      }

      return res.status(201).json({
        success: true,
        message: "Payment processed successfully",
        payment: newPayment,
        membership: membershipResult,
        extendedMembership: extendMembership
      });
    }

    // ✅ PUT /api/payments/:id - Update payment
    if (method === "PUT" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      const { amount, method, description, status } = req.body;

      const updateData = {};
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (method !== undefined) updateData.method = method;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = new Date();

      const updated = await prisma.payment.update({
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
        payment: updated
      });
    }

    // ✅ DELETE /api/payments/:id - Delete payment
    if (method === "DELETE" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      
      // Check if payment exists
      const payment = await prisma.payment.findUnique({ where: { id } });
      if (!payment) {
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

    // ✅ GET /api/payments/student/:studentId - Get payments for specific student
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

    // ✅ GET /api/payments/stats - Payment statistics
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "stats") {
      await authorizeRole("ADMIN", user);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const [totalPayments, monthlyPayments, yearlyPayments, totalRevenue, monthlyRevenue, yearlyRevenue] = await Promise.all([
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
          yearlyRevenue: yearlyRevenue._sum.amount || 0
        }
      });
    }

    // 🚫 Unsupported route
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
        "GET /api/payments/stats"
      ]
    });

  } catch (err) {
    console.error("❌ Payments API ERROR:", err);
    
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
      // Prisma error
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
};