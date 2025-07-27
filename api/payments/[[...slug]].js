// Line 1-15: Complete Payment API with enhanced membership integration, atomic transactions, and grandfathered pricing
import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

// Line 5-30: Enhanced helper function for individual student pricing calculations
const getPricingForStudent = (student) => {
  const monthlyRate = student.monthlyRate || 1400; // Default to current standard rate
  const yearlyRate = monthlyRate * 12; // Always calculate yearly as monthly × 12
  
  // Line 10-20: Determine pricing tier for display and validation
  let pricingTier = "Standard";
  if (student.isLegacyStudent) {
    if (monthlyRate === 1000) pricingTier = "Founding Member";
    else if (monthlyRate === 1200) pricingTier = "Early Adopter";
    else pricingTier = "Legacy";
  }
  
  return {
    monthly: monthlyRate,
    yearly: yearlyRate,
    tier: pricingTier,
    isLegacy: student.isLegacyStudent || false,
    monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
    yearlyFormatted: `₱${yearlyRate.toLocaleString()}`
  };
};

// Line 35-45: Helper function for consistent date formatting in logs
const formatDateForLog = (date) => {
  return date.toISOString().split('T')[0];
};

// Line 50-65: Enhanced membership end date calculation with proper date arithmetic
const calculateMembershipEndDate = (startDate, membershipType) => {
  const start = new Date(startDate);
  let end;
  
  if (membershipType === "YEARLY") {
    // Add exactly 365 days for yearly membership
    end = new Date(start);
    end.setTime(start.getTime() + (365 * 24 * 60 * 60 * 1000));
  } else {
    // Add exactly 30 days for monthly membership using milliseconds
    end = new Date(start);
    end.setTime(start.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  
  console.log(`📅 Membership calculation: ${formatDateForLog(start)} + ${membershipType === "YEARLY" ? "365" : "30"} days = ${formatDateForLog(end)}`);
  return end;
};

// Line 70-80: Enhanced payment date parsing with proper timezone handling
const parsePaymentDate = (dateString) => {
  if (!dateString) return new Date();
  
  // Parse YYYY-MM-DD format and create date at noon local time to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Month is 0-indexed, set to noon
};

// Line 85-95: Main API handler with comprehensive routing
export default async function handler(req, res) {
  const { method, query } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Extract path parts after "/api/payments"
  const parts = pathname.split("/").filter(Boolean);
  const paymentsIndex = parts.indexOf("payments");
  const pathParts = paymentsIndex !== -1 ? parts.slice(paymentsIndex + 1) : [];

  console.log("🔥 Enhanced Payments API with Grandfathered Pricing");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("PATH PARTS:", pathParts);
  console.log("METHOD:", method);
  console.log("BODY:", req.body);

  try {
    const user = await authenticate(req);

    // Line 110-135: GET /api/payments – List all payments with enhanced filtering
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

      // Line 125-135: Enhance payments with pricing information
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

    // Line 140-170: GET /api/payments/:id – Get specific payment details with pricing info
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

    // Line 175-205: NEW: GET /api/payments/pricing/:studentId – Get student's pricing information
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

    // Line 210-320: ENHANCED POST /api/payments/create with individual pricing validation and atomic transactions
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "create") {
      await authorizeRole("ADMIN", user);

      const { 
        studentId, 
        amount, 
        method = "CASH", 
        description = "", 
        extendMembership = true,
        membershipType = "MONTHLY",
        paymentDate // Accept custom payment date
      } = req.body;

      // Line 225-240: Comprehensive input validation
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

      // Line 245-280: Enhanced payment date validation
      if (paymentDate) {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(paymentDate)) {
          return res.status(400).json({
            success: false,
            error: "Invalid payment date format. Expected YYYY-MM-DD"
          });
        }

        // Parse and validate date range
        const [year, month, day] = paymentDate.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Normalize times for comparison
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

      // Line 285-300: Verify student exists and get current membership + pricing data
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

      // Line 305-325: ENHANCED: Individual pricing validation based on student's rates
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
              isLegacy: pricing.isLegacy,
              monthlyFormatted: pricing.monthlyFormatted,
              yearlyFormatted: pricing.yearlyFormatted
            }
          });
        }
      }

      // Line 330-420: Enhanced atomic transaction - payment creation with membership extension
      const result = await prisma.$transaction(async (tx) => {
        // Determine payment date with proper timezone handling
        const paidAtDate = parsePaymentDate(paymentDate);
        
        // Create payment record with enhanced description
        const pricing = getPricingForStudent(student);
        const paymentData = {
          studentId: Number(studentId),
          amount: parseFloat(amount),
          method: method || "CASH",
          description: description || `${membershipType} membership payment (${pricing.tier} rate)`,
          status: "COMPLETED",
          paidAt: paidAtDate
        };

        console.log("Creating payment with enhanced data:", paymentData);

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

        console.log("Payment created:", newPayment);

        let membershipResult = null;

        // Line 365-420: Handle membership extension if requested
        if (extendMembership) {
          try {
            // Find the most recent membership
            let latestMembership = await tx.membership.findFirst({
              where: { studentId: Number(studentId) },
              orderBy: { endDate: 'desc' }
            });

            // Use payment date as base for membership calculation
            const baseDate = paidAtDate;
            let startDate = new Date(baseDate);

            // Calculate membership dates based on existing membership
            if (latestMembership) {
              const membershipEndDate = new Date(latestMembership.endDate);
              
              // If current membership is still active, extend from end date
              // If expired, start from payment date
              startDate = membershipEndDate > baseDate ? membershipEndDate : baseDate;
              
              console.log(`📊 Latest membership ends: ${formatDateForLog(membershipEndDate)}`);
              console.log(`📊 Payment date: ${formatDateForLog(baseDate)}`);
              console.log(`📊 New membership starts: ${formatDateForLog(startDate)}`);
            } else {
              // New member - start from payment date
              startDate = baseDate;
              console.log(`🆕 New member - membership starts: ${formatDateForLog(startDate)}`);
            }

            // Calculate end date with proper date arithmetic using helper function
            const endDate = calculateMembershipEndDate(startDate, membershipType);

            // Create new membership record (enhanced with pricing context)
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

      // Line 425-455: Enhanced response with complete transaction details and pricing information
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

      console.log("Sending enhanced response:", response);
      
      return res.status(201).json(response);
    }

    // Line 460-530: PUT /api/payments/:id – Update existing payment with enhanced validation
    if (method === "PUT" && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      await authorizeRole("ADMIN", user);

      const id = Number(pathParts[0]);
      const { amount, method, description, status, paymentDate } = req.body;

      // Check if payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              monthlyRate: true,
              isLegacyStudent: true
            }
          }
        }
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

      // Handle payment date updates with enhanced timezone handling
      if (paymentDate !== undefined) {
        if (paymentDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(paymentDate)) {
            return res.status(400).json({
              success: false,
              error: "Invalid payment date format. Expected YYYY-MM-DD"
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

    // Line 535-555: DELETE /api/payments/:id – Delete payment (admin only)
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

    // Line 560-590: GET /api/payments/student/:studentId – Get payments for specific student with pricing
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

    // Line 595-650: ENHANCED GET /api/payments/stats – Payment statistics with pricing breakdown
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
        // NEW: Enhanced pricing breakdown by student rates
        prisma.student.groupBy({
          by: ['monthlyRate', 'isLegacyStudent'],
          _count: { _all: true }
        })
      ]);

      // Process pricing breakdown for frontend display
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
          isLegacy: group.isLegacyStudent,
          monthlyFormatted: `₱${rate.toLocaleString()}`,
          yearlyFormatted: `₱${(rate * 12).toLocaleString()}`
        };
      });

      // Enhance recent payments with pricing information
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

    // Line 655-685: GET /api/payments/verify/:paymentId – Enhanced payment verification with pricing context
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

      // Check if payment amount matches any recent membership with pricing context
      const paymentDate = new Date(payment.paidAt);
      const studentPricing = getPricingForStudent(payment.student);
      
      const matchingMembership = payment.student.memberships.find(m => {
        const membershipDate = new Date(m.startDate);
        const timeDiff = Math.abs(membershipDate - paymentDate);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        return daysDiff <= 1; // Match memberships created within 1 day of payment
      });

      // Enhanced verification with pricing validation
      const expectedMonthly = studentPricing.monthly;
      const expectedYearly = studentPricing.yearly;
      const paymentAmount = payment.amount;
      
      const amountMatchesExpected = paymentAmount === expectedMonthly || paymentAmount === expectedYearly;

      return res.status(200).json({
        success: true,
        payment: {
          ...payment,
          studentPricing
        },
        membershipFound: !!matchingMembership,
        membership: matchingMembership || null,
        student: payment.student,
        verification: {
          amountMatchesExpected,
          expectedAmounts: {
            monthly: expectedMonthly,
            yearly: expectedYearly
          },
          actualAmount: paymentAmount,
          pricingTier: studentPricing.tier
        }
      });
    }

    // Line 690-710: Unsupported route handler with enhanced available routes list
    return res.status(404).json({ 
      success: false, 
      error: "Route not found",
      availableRoutes: [
        "GET /api/payments",
        "GET /api/payments/:id",
        "GET /api/payments/pricing/:studentId",
        "POST /api/payments/create",
        "PUT /api/payments/:id",
        "DELETE /api/payments/:id",
        "GET /api/payments/student/:studentId",
        "GET /api/payments/stats",
        "GET /api/payments/verify/:paymentId"
      ]
    });

  } catch (err) {
    console.error("❌ Enhanced Payments API ERROR:", err);
    
    // Line 715-750: Comprehensive error handling with proper HTTP status codes
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
      // Enhanced Prisma error handling
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