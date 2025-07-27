// Line 1-15: FIXED Dashboard API with individual pricing calculations and legacy student revenue projections
import { authenticate, authorizeRole } from "../../utils/auth";
import prisma from "../../utils/db";

// Line 5-25: Enhanced dashboard handler with comprehensive routing
export default async function handler(req, res) {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Extract route path after "/api/dashboard"
  const parts = pathname.split("/").filter(Boolean);
  const dashboardIndex = parts.indexOf("dashboard");
  const routePath = dashboardIndex !== -1 && parts.length > dashboardIndex + 1 
    ? parts.slice(dashboardIndex + 1).join("/") 
    : "/";

  console.log("🏪 Dashboard API hit");
  console.log("REQ.URL:", req.url);
  console.log("PATHNAME:", pathname);
  console.log("ROUTE PATH:", routePath);
  console.log("METHOD:", method);

  try {
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    if (method === "GET") {
      return await handleGetRoutes(routePath, res, user);
    } else if (method === "POST") {
      return await handlePostRoutes(routePath, req, res, user);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    return handleError(err, res);
  }
}

// Line 35-60: Enhanced GET route handler
async function handleGetRoutes(routePath, res, user) {
  console.log("Handling GET route:", routePath);
  
  switch (routePath) {
    case '/':
      return await getDashboardOverview(user, res);
    
    case 'overdue':
      return await getOverdueStudents(res);
    
    case 'stats':
      return await getDashboardStats(res);
    
    case 'recent':
      return await getRecentActivity(res);
    
    case 'revenue':
      return await getRevenueStats(res);
    
    case 'pricing':
      return await getPricingAnalytics(res);
    
    default:
      console.error("Unknown route path:", routePath);
      return res.status(404).json({ 
        error: "Route not found",
        routePath,
        availableRoutes: ['/', '/overdue', '/stats', '/recent', '/revenue', '/pricing']
      });
  }
}

// Line 65-150: FIXED Enhanced dashboard overview with individual pricing calculations
async function getDashboardOverview(user, res) {
  try {
    console.log("🔍 Getting enhanced dashboard overview with individual pricing...");
    
    // Basic student counts
    const totalStudents = await prisma.student.count().catch(err => {
      console.error("Error counting students:", err);
      return 0;
    });
    
    console.log("👥 Total students:", totalStudents);
    
    const activeStudents = await prisma.student.count({
      where: {
        memberships: {
          some: {
            endDate: { gt: new Date() }
          }
        }
      }
    }).catch(err => {
      console.error("Error counting active students:", err);
      return 0;
    });
    
    console.log("✅ Active students:", activeStudents);
    
    // Enhanced overdue calculation (expired within 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const overdueStudents = await prisma.student.count({
      where: {
        memberships: {
          some: {
            endDate: { 
              gte: thirtyDaysAgo,
              lt: new Date() 
            }
          }
        }
      }
    }).catch(err => {
      console.error("Error counting overdue students:", err);
      return 0;
    });
    
    console.log("⚠️ Overdue students:", overdueStudents);
    
    // FIXED: Enhanced revenue calculations
    const totalRevenueData = await prisma.payment.aggregate({ 
      _sum: { amount: true } 
    }).catch(err => {
      console.error("Error aggregating total revenue:", err);
      return { _sum: { amount: 0 } };
    });
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const thisMonthRevenueData = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: startOfMonth,
          lt: new Date()
        }
      }
    }).catch(err => {
      console.error("Error aggregating this month revenue:", err);
      return { _sum: { amount: 0 } };
    });

    // FIXED: Calculate revenue potential based on individual student rates
    const studentsWithPricing = await prisma.student.findMany({
      select: {
        id: true,
        monthlyRate: true,
        isLegacyStudent: true,
        memberships: {
          where: {
            endDate: { gt: new Date() }
          },
          select: {
            id: true
          }
        }
      }
    }).catch(err => {
      console.error("Error fetching students with pricing:", err);
      return [];
    });

    // Calculate pricing breakdown and revenue potential
    const pricingAnalysis = studentsWithPricing.reduce((acc, student) => {
      const monthlyRate = student.monthlyRate || 1400;
      const isLegacy = student.isLegacyStudent || false;
      const isActive = student.memberships.length > 0;
      
      acc.total++;
      acc.totalMonthlyPotential += monthlyRate;
      acc.totalYearlyPotential += (monthlyRate * 12);
      
      if (isActive) {
        acc.activeMonthlyRevenue += monthlyRate;
        acc.activeYearlyRevenue += (monthlyRate * 12);
      }
      
      if (isLegacy) {
        acc.legacyCount++;
        acc.legacyMonthlyPotential += monthlyRate;
        if (monthlyRate === 1000) acc.founding++;
        else if (monthlyRate === 1200) acc.early++;
        else acc.legacy++;
      } else {
        acc.standardCount++;
        acc.standardMonthlyPotential += monthlyRate;
      }
      
      return acc;
    }, {
      total: 0,
      founding: 0,
      early: 0,
      legacy: 0,
      standardCount: 0,
      legacyCount: 0,
      totalMonthlyPotential: 0,
      totalYearlyPotential: 0,
      activeMonthlyRevenue: 0,
      activeYearlyRevenue: 0,
      legacyMonthlyPotential: 0,
      standardMonthlyPotential: 0
    });

    const inactiveStudents = Math.max(0, totalStudents - activeStudents - overdueStudents);
    const totalRevenue = totalRevenueData?._sum?.amount || 0;
    const thisMonthRevenue = thisMonthRevenueData?._sum?.amount || 0;
    const averageMonthlyRate = pricingAnalysis.total > 0 ? pricingAnalysis.totalMonthlyPotential / pricingAnalysis.total : 1400;

    // FIXED: Enhanced summary with individual pricing insights
    const summary = {
      message: "Enhanced Admin Dashboard with Individual Pricing",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      summary: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        inactiveStudents: inactiveStudents || 0,
        overdueStudents: overdueStudents || 0,
        totalRevenue: parseFloat((totalRevenue || 0).toFixed(2)),
        thisMonthRevenue: parseFloat((thisMonthRevenue || 0).toFixed(2)),
        
        // ENHANCED: Individual pricing analytics
        pricingBreakdown: {
          legacyStudents: pricingAnalysis.legacyCount,
          standardStudents: pricingAnalysis.standardCount,
          foundingMembers: pricingAnalysis.founding,
          earlyAdopters: pricingAnalysis.early,
          otherLegacy: pricingAnalysis.legacy,
          averageMonthlyRate: Math.round(averageMonthlyRate),
        },
        
        // ENHANCED: Revenue potential calculations
        revenuePotential: {
          totalMonthlyPotential: Math.round(pricingAnalysis.totalMonthlyPotential),
          totalYearlyPotential: Math.round(pricingAnalysis.totalYearlyPotential),
          activeMonthlyRevenue: Math.round(pricingAnalysis.activeMonthlyRevenue),
          activeYearlyRevenue: Math.round(pricingAnalysis.activeYearlyRevenue),
          legacyMonthlyPotential: Math.round(pricingAnalysis.legacyMonthlyPotential),
          standardMonthlyPotential: Math.round(pricingAnalysis.standardMonthlyPotential),
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log("📊 Enhanced dashboard summary:", JSON.stringify(summary, null, 2));
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error getting enhanced dashboard overview:", error);
    throw error;
  }
}

// Line 155-180: NEW: Enhanced pricing analytics endpoint
async function getPricingAnalytics(res) {
  try {
    console.log("💰 Getting detailed pricing analytics...");
    
    const pricingBreakdown = await prisma.student.groupBy({
      by: ['monthlyRate', 'isLegacyStudent'],
      _count: { _all: true },
      _sum: { monthlyRate: true }
    }).catch(err => {
      console.error("Error getting pricing breakdown:", err);
      return [];
    });

    const processedBreakdown = pricingBreakdown.map(group => {
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
        monthlyRevenuePotential: rate * group._count._all,
        yearlyRevenuePotential: (rate * 12) * group._count._all,
        monthlyFormatted: `₱${rate.toLocaleString()}`,
        yearlyFormatted: `₱${(rate * 12).toLocaleString()}`
      };
    });

    const totals = processedBreakdown.reduce((acc, item) => {
      acc.totalStudents += item.studentCount;
      acc.totalMonthlyPotential += item.monthlyRevenuePotential;
      acc.totalYearlyPotential += item.yearlyRevenuePotential;
      if (item.isLegacy) acc.legacyStudents += item.studentCount;
      return acc;
    }, {
      totalStudents: 0,
      totalMonthlyPotential: 0,
      totalYearlyPotential: 0,
      legacyStudents: 0
    });

    return res.status(200).json({
      success: true,
      pricingBreakdown: processedBreakdown,
      totals: {
        ...totals,
        averageMonthlyRate: totals.totalStudents > 0 ? totals.totalMonthlyPotential / totals.totalStudents : 1400,
        legacyPercentage: totals.totalStudents > 0 ? Math.round((totals.legacyStudents / totals.totalStudents) * 100) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting pricing analytics:", error);
    throw error;
  }
}

// Line 185-220: Enhanced overdue students with pricing context
async function getOverdueStudents(res) {
  try {
    console.log('⚠️ Getting overdue students with pricing info...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const overdueStudents = await prisma.student.findMany({
      where: {
        memberships: {
          some: {
            endDate: { 
              gte: thirtyDaysAgo,
              lt: new Date() 
            }
          }
        }
      },
      include: {
        memberships: {
          where: {
            endDate: { 
              gte: thirtyDaysAgo,
              lt: new Date() 
            }
          },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    // Add pricing information to each overdue student
    const enhancedOverdueStudents = overdueStudents.map(student => {
      const monthlyRate = student.monthlyRate || 1400;
      const isLegacy = student.isLegacyStudent || false;
      
      let tier = "Standard";
      if (isLegacy) {
        if (monthlyRate === 1000) tier = "Founding Member";
        else if (monthlyRate === 1200) tier = "Early Adopter";
        else tier = "Legacy";
      }

      return {
        ...student,
        pricingInfo: {
          tier,
          monthlyRate,
          yearlyRate: monthlyRate * 12,
          isLegacy,
          monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
          yearlyFormatted: `₱${(monthlyRate * 12).toLocaleString()}`
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedOverdueStudents.length,
      students: enhancedOverdueStudents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting overdue students:", error);
    throw error;
  }
}

// Line 225-290: Enhanced revenue statistics with pricing breakdown
async function getRevenueStats(res) {
  try {
    console.log("💵 Getting enhanced revenue stats with pricing analysis...");
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const [totalRevenue, thisMonthRevenue, thisYearRevenue, lastMonthRevenue] = await Promise.allSettled([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1)
          }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1)
          }
        }
      })
    ]);

    const total = totalRevenue.status === 'fulfilled' ? totalRevenue.value?._sum?.amount || 0 : 0;
    const thisMonth = thisMonthRevenue.status === 'fulfilled' ? thisMonthRevenue.value?._sum?.amount || 0 : 0;
    const thisYear = thisYearRevenue.status === 'fulfilled' ? thisYearRevenue.value?._sum?.amount || 0 : 0;
    const lastMonth = lastMonthRevenue.status === 'fulfilled' ? lastMonthRevenue.value?._sum?.amount || 0 : 0;

    const monthlyGrowth = lastMonth > 0 ? 
      (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 
      thisMonth > 0 ? "100" : "0";

    // ENHANCED: Get revenue by pricing tier
    const revenueByTier = await prisma.payment.findMany({
      include: {
        student: {
          select: {
            monthlyRate: true,
            isLegacyStudent: true
          }
        }
      },
      where: {
        paidAt: {
          gte: new Date(currentYear, currentMonth, 1)
        }
      }
    }).catch(err => {
      console.error("Error getting revenue by tier:", err);
      return [];
    });

    const tierBreakdown = revenueByTier.reduce((acc, payment) => {
      const rate = payment.student?.monthlyRate || 1400;
      const isLegacy = payment.student?.isLegacyStudent || false;
      
      let tier = "Standard";
      if (isLegacy) {
        if (rate === 1000) tier = "Founding Member";
        else if (rate === 1200) tier = "Early Adopter";
        else tier = "Legacy";
      }
      
      if (!acc[tier]) {
        acc[tier] = { revenue: 0, paymentCount: 0 };
      }
      
      acc[tier].revenue += payment.amount;
      acc[tier].paymentCount += 1;
      
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      revenue: {
        total: parseFloat(total.toFixed(2)),
        thisMonth: parseFloat(thisMonth.toFixed(2)),
        thisYear: parseFloat(thisYear.toFixed(2)),
        lastMonth: parseFloat(lastMonth.toFixed(2)),
        monthlyGrowthPercentage: monthlyGrowth + "%"
      },
      tierBreakdown: Object.entries(tierBreakdown).map(([tier, data]) => ({
        tier,
        revenue: parseFloat(data.revenue.toFixed(2)),
        paymentCount: data.paymentCount,
        averagePayment: parseFloat((data.revenue / data.paymentCount).toFixed(2))
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting enhanced revenue stats:", error);
    throw error;
  }
}

// Line 295-330: Enhanced dashboard statistics
async function getDashboardStats(res) {
  try {
    console.log("📈 Getting enhanced dashboard statistics...");
    
    const [totalMemberships, activeMemberships, totalPayments, studentStats] = await Promise.allSettled([
      prisma.membership.count(),
      prisma.membership.count({
        where: {
          endDate: { gt: new Date() }
        }
      }),
      prisma.payment.count(),
      prisma.student.groupBy({
        by: ['isLegacyStudent'],
        _count: { _all: true }
      })
    ]);

    const membershipData = {
      total: totalMemberships.status === 'fulfilled' ? totalMemberships.value : 0,
      active: activeMemberships.status === 'fulfilled' ? activeMemberships.value : 0
    };

    const paymentCount = totalPayments.status === 'fulfilled' ? totalPayments.value : 0;
    
    const studentBreakdown = studentStats.status === 'fulfilled' ? 
      studentStats.value.reduce((acc, group) => {
        if (group.isLegacyStudent) {
          acc.legacy = group._count._all;
        } else {
          acc.standard = group._count._all;
        }
        return acc;
      }, { legacy: 0, standard: 0 }) : { legacy: 0, standard: 0 };

    membershipData.expired = membershipData.total - membershipData.active;

    return res.status(200).json({
      success: true,
      stats: {
        memberships: membershipData,
        payments: {
          total: paymentCount
        },
        students: {
          legacy: studentBreakdown.legacy,
          standard: studentBreakdown.standard,
          total: studentBreakdown.legacy + studentBreakdown.standard
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
}

// Line 335-380: Enhanced recent activity with pricing context
async function getRecentActivity(res) {
  try {
    console.log("🕒 Getting recent activity with pricing context...");
    
    const [recentStudents, recentPayments, recentMemberships] = await Promise.allSettled([
      prisma.student.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          monthlyRate: true,
          isLegacyStudent: true,
          user: {
            select: {
              createdAt: true
            }
          }
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { paidAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              monthlyRate: true,
              isLegacyStudent: true
            }
          }
        }
      }),
      prisma.membership.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              monthlyRate: true,
              isLegacyStudent: true
            }
          }
        }
      })
    ]);

    // Enhance recent data with pricing information
    const enhanceWithPricing = (items) => {
      return items.map(item => {
        const student = item.student || item;
        const monthlyRate = student.monthlyRate || 1400;
        const isLegacy = student.isLegacyStudent || false;
        
        let tier = "Standard";
        if (isLegacy) {
          if (monthlyRate === 1000) tier = "Founding Member";
          else if (monthlyRate === 1200) tier = "Early Adopter";
          else tier = "Legacy";
        }
        
        return {
          ...item,
          pricingInfo: {
            tier,
            monthlyRate,
            isLegacy
          }
        };
      });
    };

    return res.status(200).json({
      success: true,
      recentActivity: {
        recentStudents: recentStudents.status === 'fulfilled' ? 
          enhanceWithPricing(recentStudents.value) : [],
        recentPayments: recentPayments.status === 'fulfilled' ? 
          enhanceWithPricing(recentPayments.value) : [],
        recentMemberships: recentMemberships.status === 'fulfilled' ? 
          enhanceWithPricing(recentMemberships.value) : []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting recent activity:", error);
    throw error;
  }
}

// Line 385-395: POST route handler (placeholder)
async function handlePostRoutes(routePath, req, res, user) {
  return res.status(501).json({ 
    error: "POST operations not implemented yet",
    availableRoutes: ['GET /', 'GET /overdue', 'GET /stats', 'GET /recent', 'GET /revenue', 'GET /pricing']
  });
}

// Line 400-430: Enhanced error handler
function handleError(err, res) {
  console.error("❌ Enhanced Dashboard API Error:", err);

  if (err.message === "Authentication required") {
    return res.status(401).json({ 
      error: "Authentication required",
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.message === "Unauthorized" || err.message.includes("Forbidden")) {
    return res.status(403).json({ 
      error: "Unauthorized: Admin access required",
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'P1001' || err.message.includes('database')) {
    return res.status(503).json({ 
      error: "Database connection error",
      timestamp: new Date().toISOString()
    });
  }

  return res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
}