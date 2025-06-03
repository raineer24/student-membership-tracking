import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

export default async function handler(req, res) {
  const { method, query } = req;
  
  // Extract slug from query params (Next.js dynamic routing)
  const { slug = [] } = query;
  const routePath = Array.isArray(slug) ? slug.join('/') : slug || '';

  console.log("DASHBOARD HANDLER HIT");
  console.log("ROUTE PATH:", routePath);
  console.log("METHOD:", method);
  console.log("FULL QUERY:", query);

  try {
    // Test database connection first
    await prisma.$connect();
    
    // Authentication and authorization
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // Route handling based on method and path
    if (method === "GET") {
      return await handleGetRoutes(routePath, user, res);
    }

    // Add other HTTP methods as needed
    if (method === "POST") {
      return await handlePostRoutes(routePath, req, res, user);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    return handleError(err, res);
  } finally {
    // Don't disconnect in development to avoid connection issues
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
}

async function handleGetRoutes(routePath, user, res) {
  switch (routePath) {
    case '':
      // GET /api/dashboard
      return await getDashboardOverview(user, res);
    
    case 'overdue':
      // GET /api/dashboard/overdue
      return await getOverdueStudents(res);
    
    case 'stats':
      // GET /api/dashboard/stats
      return await getDetailedStats(res);
    
    case 'recent':
      // GET /api/dashboard/recent
      return await getRecentActivity(res);
    
    case 'revenue':
      // GET /api/dashboard/revenue
      return await getRevenueStats(res);
    
    default:
      return res.status(404).json({ 
        error: "Route not found",
        availableRoutes: ['/', '/overdue', '/stats', '/recent', '/revenue']
      });
  }
}

async function getDashboardOverview(user, res) {
  try {
    console.log("Getting dashboard overview...");
    
    // Execute queries sequentially with better error handling
    const totalStudents = await prisma.student.count().catch(err => {
      console.error("Error counting students:", err);
      return 0;
    });
    
    console.log("Total students:", totalStudents);
    
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
    
    console.log("Active students:", activeStudents);
    
    const totalMemberships = await prisma.membership.count().catch(err => {
      console.error("Error counting memberships:", err);
      return 0;
    });
    
    const activeMemberships = await prisma.membership.count({
      where: {
        endDate: { gt: new Date() }
      }
    }).catch(err => {
      console.error("Error counting active memberships:", err);
      return 0;
    });
    
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
    
    const overdueCount = await prisma.student.count({
      where: {
        memberships: {
          some: {
            endDate: { lt: new Date() }
          }
        }
      }
    }).catch(err => {
      console.error("Error counting overdue students:", err);
      return 0;
    });

    // Safe calculations with null checks
    const inactiveStudents = Math.max(0, totalStudents - activeStudents);
    const expiredMemberships = Math.max(0, totalMemberships - activeMemberships);
    const totalRevenue = totalRevenueData?._sum?.amount || 0;
    const thisMonthRevenue = thisMonthRevenueData?._sum?.amount || 0;

    const summary = {
      message: "Admin Dashboard Overview",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      summary: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        inactiveStudents,
        totalMemberships: totalMemberships || 0,
        activeMemberships: activeMemberships || 0,
        expiredMemberships,
        totalRevenue: parseFloat((totalRevenue || 0).toFixed(2)),
        thisMonthRevenue: parseFloat((thisMonthRevenue || 0).toFixed(2)),
        pendingPayments: overdueCount || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log("Dashboard overview summary:", summary);
    return res.status(200).json(summary);
    
  } catch (error) {
    console.error("Error getting dashboard overview:", error);
    throw error;
  }
}

async function getOverdueStudents(res) {
 
  try {
      console.log('getting students overdue!');
    const overdueStudents = await prisma.student.findMany({
      where: {
        memberships: {
          some: {
            endDate: {
              lt: new Date(),
            },
          },
        },
      },
      include: {
        memberships: {
          where: {
            endDate: { lt: new Date() }
          },
          orderBy: {
            endDate: 'desc'
          }
        },
      },
    }).catch(err => {
      console.error("Error finding overdue students:", err);
      return [];
    });

    return res.status(200).json({
      count: overdueStudents?.length || 0,
      students: overdueStudents || []
    });
  } catch (error) {
    console.error("Error getting overdue students:", error);
    throw error;
  }
}

async function getDetailedStats(res) {
  try {
    const totalStudents = await prisma.student.count().catch(() => 0);
    const active = await prisma.membership.count({ 
      where: { endDate: { gt: new Date() } } 
    }).catch(() => 0);
    const expired = await prisma.membership.count({ 
      where: { endDate: { lt: new Date() } } 
    }).catch(() => 0);

    const total = active + expired;

    return res.status(200).json({
      students: {
        total: totalStudents || 0
      },
      memberships: {
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
        activePercentage: total > 0 ? ((active / total) * 100).toFixed(1) + "%" : "0%",
        expiredPercentage: total > 0 ? ((expired / total) * 100).toFixed(1) + "%" : "0%"
      }
    });
  } catch (error) {
    console.error("Error getting detailed stats:", error);
    throw error;
  }
}

async function getRecentActivity(res) {
  try {
    const [recentStudents, recentPayments, recentMemberships] = await Promise.allSettled([
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { paidAt: 'desc' },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.membership.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    return res.status(200).json({
      recentStudents: recentStudents.status === 'fulfilled' ? recentStudents.value : [],
      recentPayments: recentPayments.status === 'fulfilled' ? recentPayments.value : [],
      recentMemberships: recentMemberships.status === 'fulfilled' ? recentMemberships.value : []
    });
  } catch (error) {
    console.error("Error getting recent activity:", error);
    throw error;
  }
}

async function getRevenueStats(res) {
  try {
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

    return res.status(200).json({
      total: parseFloat(total.toFixed(2)),
      thisMonth: parseFloat(thisMonth.toFixed(2)),
      thisYear: parseFloat(thisYear.toFixed(2)),
      lastMonth: parseFloat(lastMonth.toFixed(2)),
      monthlyGrowthPercentage: monthlyGrowth + "%"
    });
  } catch (error) {
    console.error("Error getting revenue stats:", error);
    throw error;
  }
}

async function handlePostRoutes(routePath, req, res, user) {
  // Add POST route handlers as needed
  return res.status(501).json({ error: "POST operations not implemented yet" });
}

function handleError(err, res) {
  console.error("Dashboard API Error:", err);

  if (err.message === "Authentication required") {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (err.message === "Unauthorized" || err.message.includes("Forbidden")) {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }

  // Database connection errors
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