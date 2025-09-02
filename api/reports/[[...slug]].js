// File: api/reports/[[...slug]].js
// Lines 1-20: Monthly Payment Report API with Excel Export - DATABASE SAFE VERSION
import prisma from "../../utils/db.js";
import { authenticate, authorizeRole } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Lines 5-13: CORS headers - Following established pattern
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Lines 14-17: Authentication using working pattern
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Lines 19-28: Route handling using URL parsing - Consistent with Events API
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    const parts = pathname.split("/").filter(Boolean);
    const reportsIndex = parts.indexOf("reports");
    const pathParts = reportsIndex !== -1 ? parts.slice(reportsIndex + 1) : [];
    
    console.log("📊 Monthly Payment Reports API");
    console.log("REQ.URL:", req.url);
    console.log("PATH PARTS:", pathParts);
    console.log("METHOD:", req.method);

    // Lines 30-35: Route handling based on method
    if (req.method === 'GET') {
      return await handleGet(req, res, pathParts);
    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Reports API Error:', error);
    
    // Lines 43-55: Enhanced error handling - Following Events API pattern
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

// Lines 60-100: GET endpoints - Monthly report generation
async function handleGet(req, res, pathParts) {
  try {
    // GET /api/reports - Available reports list
    if (pathParts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          availableReports: [
            {
              type: "monthly",
              path: "/api/reports/monthly",
              description: "Monthly payment report with Excel export"
            }
          ]
        }
      });
    }

    // GET /api/reports/monthly - Monthly payment report
    if (pathParts.length === 1 && pathParts[0] === "monthly") {
      const { month, year, export: exportFormat } = req.query;
      
      // Default to current month/year if not provided
      const now = new Date();
      const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
      const targetYear = year ? parseInt(year) : now.getFullYear();
      
      // Validate month/year parameters
      if (targetMonth < 0 || targetMonth > 11) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }
      
      if (targetYear < 2020 || targetYear > now.getFullYear() + 1) {
        return res.status(400).json({
          success: false,
          message: 'Year must be between 2020 and next year'
        });
      }

      console.log(`📅 Generating monthly report for ${targetYear}/${targetMonth + 1}`);
      
      const reportData = await generateMonthlyReport(targetMonth, targetYear);
      
      // Excel export functionality
      if (exportFormat === 'excel') {
        return await generateExcelReport(res, reportData, targetMonth, targetYear);
      }
      
      // JSON response for dashboard consumption
      return res.status(200).json({
        success: true,
        data: reportData
      });
    }

    // Route not found
    return res.status(404).json({
      success: false,
      message: 'Report type not found',
      availableRoutes: ['/', '/monthly']
    });

  } catch (error) {
    console.error('Reports GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lines 115-200: Core business logic - Monthly report generation (DATABASE SAFE)
async function generateMonthlyReport(month, year) {
  // Date range calculation
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  console.log(`📊 Querying payments from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  try {
    // Core payment data query - Following existing payment API patterns (DATABASE SAFE)
    const [paymentsData, studentsData] = await Promise.all([
      // Payments within date range with student details
      prisma.payment.findMany({
        where: {
          paidAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              // Safe access - use optional fields with defaults
              memberships: {
                orderBy: { endDate: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: {
          paidAt: 'desc'
        }
      }),
      
      // All students for context (total count, active status) - DATABASE SAFE
      prisma.student.findMany({
        select: {
          id: true,
          name: true,
          memberships: {
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      })
    ]);

    // Business intelligence calculations
    const totalPayments = paymentsData.length;
    const totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Pricing tier breakdown - Safe defaults
    const pricingBreakdown = {
      founding: { count: 0, revenue: 0, rate: 1200 },
      early: { count: 0, revenue: 0, rate: 1300 },
      standard: { count: 0, revenue: 0, rate: 1400 }
    };

    // Payment method tracking
    const paymentMethods = {};

    // Student status analysis
    let paidStudents = 0;
    const activeStudentsWhoNotPaid = [];

    // Process payment data - SAFE ACCESS
    paymentsData.forEach(payment => {
      // Use safe defaults for missing fields
      const amount = payment.amount || 0;
      
      // Since monthlyRate/isLegacyStudent may not exist, use amount-based categorization
      if (amount <= 1200) {
        pricingBreakdown.founding.count++;
        pricingBreakdown.founding.revenue += amount;
      } else if (amount <= 1300) {
        pricingBreakdown.early.count++;
        pricingBreakdown.early.revenue += amount;
      } else {
        pricingBreakdown.standard.count++;
        pricingBreakdown.standard.revenue += amount;
      }

      // Track payment methods
      const method = payment.method || 'CASH';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;

      paidStudents++;
    });

    // Calculate student payment status - SAFE ACCESS
    const paidStudentIds = new Set(paymentsData.map(p => p.student.id));
    
    studentsData.forEach(student => {
      if (!paidStudentIds.has(student.id)) {
        // Check if student has active membership (should have paid)
        const latestMembership = student.memberships && student.memberships[0];
        if (latestMembership && new Date(latestMembership.endDate) > startDate) {
          activeStudentsWhoNotPaid.push({
            id: student.id,
            name: student.name,
            expectedAmount: 1400, // Default rate if monthlyRate not available
            membershipEndDate: latestMembership.endDate
          });
        }
      }
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Return comprehensive report data
    return {
      reportMetadata: {
        month: month + 1,
        year: year,
        monthName: monthNames[month],
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        generatedAt: new Date().toISOString()
      },
      
      summary: {
        totalStudents: studentsData.length,
        studentsWhoPaid: paidStudents,
        studentsWhoDidNotPay: activeStudentsWhoNotPaid.length,
        totalPayments: totalPayments,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averagePayment: totalPayments > 0 ? parseFloat((totalRevenue / totalPayments).toFixed(2)) : 0
      },

      pricingBreakdown: {
        founding: {
          ...pricingBreakdown.founding,
          revenue: parseFloat(pricingBreakdown.founding.revenue.toFixed(2))
        },
        early: {
          ...pricingBreakdown.early,
          revenue: parseFloat(pricingBreakdown.early.revenue.toFixed(2))
        },
        standard: {
          ...pricingBreakdown.standard,
          revenue: parseFloat(pricingBreakdown.standard.revenue.toFixed(2))
        }
      },

      paymentMethods: paymentMethods,
      
      payments: paymentsData.map(payment => ({
        id: payment.id,
        studentName: payment.student.name,
        studentEmail: payment.student.email,
        amount: payment.amount || 0,
        method: payment.method || 'CASH',
        description: payment.description || '',
        paidAt: payment.paidAt,
        studentTier: 'Standard', // Default since we can't access isLegacyStudent safely
        expectedRate: 1400 // Default rate
      })),

      missedPayments: activeStudentsWhoNotPaid
    };

  } catch (dbError) {
    console.error('Database query error:', dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }
}

// Lines 235-280: Excel export functionality - Phase 2 implementation placeholder
async function generateExcelReport(res, reportData, month, year) {
  // Phase 1: Basic CSV export (immediate implementation)
  const csvData = generateCSVReport(reportData);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${String(month + 1).padStart(2, '0')}.csv"`);
  
  return res.status(200).send(csvData);
  
  // Phase 2: Excel implementation (future enhancement)
  // TODO: Implement ExcelJS integration
  // const ExcelJS = require('exceljs');
  // const workbook = new ExcelJS.Workbook();
  // ... Excel generation logic
}

// Lines 285-320: CSV generation utility - Simple and effective
function generateCSVReport(reportData) {
  const headers = [
    'Student Name',
    'Email', 
    'Amount',
    'Payment Method',
    'Date Paid',
    'Student Tier',
    'Expected Rate',
    'Description'
  ].join(',') + '\n';

  const rows = reportData.payments.map(payment => [
    `"${payment.studentName || ''}"`,
    `"${payment.studentEmail || ''}"`,
    payment.amount || 0,
    payment.method || 'CASH',
    payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : '',
    payment.studentTier || 'Standard',
    payment.expectedRate || 1400,
    `"${payment.description || ''}"`
  ].join(',') + '\n').join('');

  // Summary section
  const summary = [
    '',
    'SUMMARY',
    `Total Students,${reportData.summary.totalStudents}`,
    `Students Who Paid,${reportData.summary.studentsWhoPaid}`,
    `Total Revenue,₱${reportData.summary.totalRevenue}`,
    `Average Payment,₱${reportData.summary.averagePayment}`,
    '',
    'PRICING BREAKDOWN',
    `Founding Members (₱${reportData.pricingBreakdown.founding.rate}),${reportData.pricingBreakdown.founding.count},₱${reportData.pricingBreakdown.founding.revenue}`,
    `Early Members (₱${reportData.pricingBreakdown.early.rate}),${reportData.pricingBreakdown.early.count},₱${reportData.pricingBreakdown.early.revenue}`,
    `Standard Members (₱${reportData.pricingBreakdown.standard.rate}),${reportData.pricingBreakdown.standard.count},₱${reportData.pricingBreakdown.standard.revenue}`
  ].join('\n') + '\n';

  return headers + rows + summary;
}