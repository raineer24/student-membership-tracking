// File: api/payments/[[...slug]].js
// Payment API with Enhanced Membership Integration and Duplicate Prevention
import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

// Helper: Get student pricing (standardized to ₱1,500)
const getPricingForStudent = (student) => {
  const monthlyRate = 1500; // All students standard rate
  const yearlyRate = 18000; // 1500 * 12
  
  let pricingTier = "Standard";
  
  return {
    monthly: monthlyRate,
    yearly: yearlyRate,
    tier: pricingTier,
    isLegacy: false,
    monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
    yearlyFormatted: `₱${yearlyRate.toLocaleString()}`
  };
};

// Helper: Format dates consistently
const formatDateForLog = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper: Calculate membership end date
const calculateMembershipEndDate = (startDate, membershipType) => {
  const start = new Date(startDate);
  let end;
  
  if (membershipType === "YEARLY") {
    end = new Date(start);
    end.setTime(start.getTime() + (365 * 24 * 60 * 60 * 1000));
  } else {
    end = new Date(start);
    end.setTime(start.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  
  console.log(`📅 Membership: ${formatDateForLog(start)} + ${membershipType === "YEARLY" ? "365" : "30"} days = ${formatDateForLog(end)}`);
  return end;
};

// Helper: Parse payment date with timezone handling
const parsePaymentDate = (dateString) => {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

// NEW: Check for duplicate payments within 60-second window
const checkDuplicatePayment = async (studentId, amount, paidAt, method) => {
  const startWindow = new Date(paidAt);
  startWindow.setSeconds(startWindow.getSeconds() - 60);
  const endWindow = new Date(paidAt);
  endWindow.setSeconds(endWindow.getSeconds() + 60);
  
  const duplicate = await prisma.payment.findFirst({
    where: {
      studentId: studentId,
      amount: amount,
      method: method,
      paidAt: {
        gte: startWindow,
        lte: endWindow
      }
    }
  });
  
  return duplicate;
};

export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  const parts = pathname.split("/").filter(Boolean);
  const paymentsIndex = parts.indexOf("payments");
  const pathParts = paymentsIndex !== -1 ? parts.slice(paymentsIndex + 1) : [];

  console.log("🔥 Payments API with Duplicate Prevention");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);
  console.log("METHOD:", method);

  try {
    const user = await authenticate(req);

    // GET /api/payments
    if (method === "GET" && pathParts.length === 0) {
      await authorizeRole("ADMIN", user);

      const payments = await prisma.payment.findMany({
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
          }
        },
        orderBy: { paidAt: 'desc' }
      });

      const enhancedPayments = payments.map(payment => ({
        ...payment,
        studentPricing: payment.student ? getPricingForStudent(payment.student) : null
      }));

      return res.status(200).json({
        success: true,
        count: enhancedPayments.length,
        payments: enhancedPayments
      });
    }

    // GET /api/payments/:id
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
              monthlyRate: true,
              isLegacyStudent: true,
              memberships: {
                orderBy: { endDate: 'desc' },
                take: 1
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

      const enhancedPayment = {
        ...payment,
        studentPricing: payment.student ? getPricingForStudent(payment.student) : null
      };

      return res.status(200).json({ 
        success: true, 
        payment: enhancedPayment 
      });
    }

    // GET /api/payments/pricing/:studentId
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "pricing" && !isNaN(Number(pathParts[1]))) {
      await authorizeRole("ADMIN", user);

      const studentId = Number(pathParts[1]);
      
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          email: true,
          monthlyRate: true,
          isLegacyStudent: true
        }
      });

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          error: "Student not found" 
        });
      }

      const pricing = getPricingForStudent(student);
      
      return res.status(200).json({
        success: true,
        student: student,
        pricing: pricing
      });
    }

    // POST /api/payments/create - WITH DUPLICATE PREVENTION
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "create") {
      await authorizeRole("ADMIN", user);

      const { 
        studentId, 
        amount, 
        method = "CASH", 
        description = "", 
        extendMembership = true,
        membershipType = "MONTHLY",
        paymentDate
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

      // Payment date validation
      if (paymentDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(paymentDate)) {
          return res.status(400).json({
            success: false,
            error: "Invalid payment date format. Expected YYYY-MM-DD"
          });
        }

        const [year, month, day] = paymentDate.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        today.setHours(23, 59, 59, 999);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        selectedDate.setHours(12, 0, 0, 0);

        if (selectedDate > today) {
          return res.status(400).json({
            success: false,
            error: "Payment date cannot be in the future"
          });
        }

        if (selectedDate < thirtyDaysAgo) {
          return res.status(400).json({
            success: false,
            error: "Payment date cannot be more than 30 days ago"
          });
        }
      }

      // Verify student exists
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

      // Pricing validation
      if (extendMembership) {
        const pricing = getPricingForStudent(student);
        const expectedAmount = membershipType === "YEARLY" ? pricing.yearly : pricing.monthly;
        const enteredAmount = parseFloat(amount);
        
        if (enteredAmount !== expectedAmount) {
          return res.status(400).json({
            success: false,
            error: `${membershipType} membership for ${pricing.tier} rate must be exactly ${pricing.monthlyFormatted} (monthly) or ${pricing.yearlyFormatted} (yearly). Received: ₱${enteredAmount.toLocaleString()}`,
            studentPricing: {
              tier: pricing.tier,
              monthly: pricing.monthly,
              yearly: pricing.yearly,
              isLegacy: pricing.isLegacy
            }
          });
        }
      }

      // NEW: Check for duplicate payment
      const paidAtDate = parsePaymentDate(paymentDate);
      
      const existingDuplicate = await checkDuplicatePayment(
        Number(studentId), 
        parseFloat(amount), 
        paidAtDate, 
        method
      );
      
      if (existingDuplicate) {
        console.log("⚠️ DUPLICATE PAYMENT DETECTED:", existingDuplicate.id);
        return res.status(409).json({
          success: false,
          error: "Duplicate payment detected. An identical payment was already recorded within the last 60 seconds.",
          duplicate: {
            id: existingDuplicate.id,
            amount: existingDuplicate.amount,
            paidAt: existingDuplicate.paidAt
          }
        });
      }

      // Atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        const pricing = getPricingForStudent(student);
        const paymentData = {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          method: method || "CASH",
          description: description || `${membershipType} membership payment (${pricing.tier} rate)`,
          status: "COMPLETED",
          paidAt: paidAtDate
        };

        console.log("Creating payment:", paymentData);

        const newPayment = await tx.payment.create({
          data: paymentData,
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
            }
          }
        });

        let membershipResult = null;

        if (extendMembership) {
          try {
            let latestMembership = await tx.membership.findFirst({
              where: { studentId: Number(studentId) },
              orderBy: { endDate: 'desc' }
            });

            const baseDate = paidAtDate;
            let startDate = new Date(baseDate);

            if (latestMembership) {
              const membershipEndDate = new Date(latestMembership.endDate);
              startDate = membershipEndDate > baseDate ? membershipEndDate : baseDate;
              
              console.log(`📊 Latest membership ends: ${formatDateForLog(membershipEndDate)}`);
              console.log(`📊 Payment date: ${formatDateForLog(baseDate)}`);
              console.log(`📊 New membership starts: ${formatDateForLog(startDate)}`);
            } else {
              console.log(`🆕 New member - membership starts: ${formatDateForLog(startDate)}`);
            }

            const endDate = calculateMembershipEndDate(startDate, membershipType);

            membershipResult = await tx.membership.create({
              data: {
                studentId: Number(studentId),
                type: membershipType,
                startDate: startDate,
                endDate: endDate,
                isActive: true,
                overdue: false
              }
            });

            console.log("✅ Membership created:", membershipResult.id);

          } catch (membershipError) {
            console.error("❌ Membership creation failed:", membershipError);
            throw new Error(`Membership extension failed: ${membershipError.message}`);
          }
        }

        return {
          payment: newPayment,
          membership: membershipResult,
          membershipExtended: !!membershipResult
        };
      });

      const pricing = getPricingForStudent(result.payment.student);
      
      const response = {
        success: true,
        message: "Payment processed successfully",
        payment: result.payment,
        student: result.payment.student,
        studentPricing: pricing,
        membershipExtended: result.membershipExtended,
        amount: parseFloat(amount),
        method: method,
        paymentDate: result.payment.paidAt
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

      console.log("✅ Payment created successfully");
      
      return res.status(201).json(response);
    }

    // PUT /api/payments/:id
    if (method === "PUT" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      const { amount, method, description, status, paymentDate } = req.body;

      const existingPayment = await prisma.payment.findUnique({
        where: { id }
      });

      if (!existingPayment) {
        return res.status(404).json({ 
          success: false, 
          error: "Payment not found" 
        });
      }

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
            error: `Invalid payment method`
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
            error: `Invalid status`
          });
        }
        updateData.status = status;
      }

      if (paymentDate !== undefined) {
        if (paymentDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(paymentDate)) {
            return res.status(400).json({
              success: false,
              error: "Invalid payment date format"
            });
          }
          
          updateData.paidAt = parsePaymentDate(paymentDate);
        } else {
          updateData.paidAt = new Date();
        }
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
              phone: true,
              monthlyRate: true,
              isLegacyStudent: true
            }
          }
        }
      });

      const enhancedPayment = {
        ...updatedPayment,
        studentPricing: updatedPayment.student ? getPricingForStudent(updatedPayment.student) : null
      };

      return res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        payment: enhancedPayment
      });
    }

    // DELETE /api/payments/:id
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

    // GET /api/payments/student/:studentId
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
              phone: true,
              monthlyRate: true,
              isLegacyStudent: true
            }
          }
        },
        orderBy: { paidAt: 'desc' }
      });

      const enhancedPayments = payments.map(payment => ({
        ...payment,
        studentPricing: payment.student ? getPricingForStudent(payment.student) : null
      }));

      return res.status(200).json({
        success: true,
        count: enhancedPayments.length,
        studentId,
        payments: enhancedPayments
      });
    }

    // GET /api/payments/stats
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
        recentPayments,
        pricingBreakdown
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
                email: true,
                monthlyRate: true,
                isLegacyStudent: true
              }
            }
          }
        }),
        prisma.student.groupBy({
          by: ['monthlyRate', 'isLegacyStudent'],
          _count: { _all: true }
        })
      ]);

      const processedPricingBreakdown = pricingBreakdown.map(group => {
        const rate = group.monthlyRate;
        let tier = "Standard";
        
        if (group.isLegacyStudent) {
          if (rate === 1000) tier = "Founding Member";
          else if (rate === 1200) tier = "Early Adopter";
          else tier = "Legacy";
        }
        
        return {
          tier,
          monthlyRate: rate,
          yearlyRate: rate * 12,
          studentCount: group._count._all,
          isLegacy: group.isLegacyStudent
        };
      });

      const enhancedRecentPayments = recentPayments.map(payment => ({
        ...payment,
        studentPricing: payment.student ? getPricingForStudent(payment.student) : null
      }));

      return res.status(200).json({
        success: true,
        stats: {
          totalPayments,
          monthlyPayments,
          yearlyPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          yearlyRevenue: yearlyRevenue._sum.amount || 0,
          recentPayments: enhancedRecentPayments,
          pricingBreakdown: processedPricingBreakdown
        }
      });
    }

    // GET /api/payments/verify/:paymentId
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

      const paymentDate = new Date(payment.paidAt);
      const studentPricing = getPricingForStudent(payment.student);
      
      const matchingMembership = payment.student.memberships.find(m => {
        const membershipDate = new Date(m.startDate);
        const timeDiff = Math.abs(membershipDate - paymentDate);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        return daysDiff <= 1;
      });

      return res.status(200).json({
        success: true,
        payment: {
          ...payment,
          studentPricing
        },
        membershipFound: !!matchingMembership,
        membership: matchingMembership || null
      });
    }

    // Unsupported route
    return res.status(404).json({ 
      success: false, 
      error: "Route not found"
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