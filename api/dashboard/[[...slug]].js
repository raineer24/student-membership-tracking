import prisma from "../../utils/db";
import { authenticate, authorizeRole } from "../../utils/auth";

export default async function handler(req, res) {
  const { method } = req;

  // Parse full URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log("DASHBOARD HANDLER HIT");
  console.log("PATHNAME:", pathname);
  console.log("METHOD:", method);

  try {
    const user = await authenticate(req);
    await authorizeRole("ADMIN", user);

    // ✅ GET /api/dashboard
    if (method === "GET" && pathname === "/api/dashboard") {
      const totalStudents = await prisma.student.count();
      const activeMemberships = await prisma.membership.count({
        where: {
          endDate: { gt: new Date() },
        },
      });
      const overdueCount = await prisma.student.count({
        where: {
          memberships: {
            some: {
              endDate: {
                lt: new Date(),
              },
            },
          },
        },
      });

      return res.status(200).json({
        totalStudents,
        activeMemberships,
        overdueCount,
      });
    }

    // ✅ GET /api/dashboard/overdue
    if (method === "GET" && pathname === "/api/dashboard/overdue") {
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
          memberships: true,
        },
      });

      return res.status(200).json(overdueStudents);
    }

    // ✅ GET /api/dashboard/stats
    if (method === "GET" && pathname === "/api/dashboard/stats") {
      const [totalStudents, active, overdue] = await Promise.all([
        prisma.student.count(),
        prisma.membership.count({ where: { endDate: { gt: new Date() } } }),
        prisma.student.count({
          where: {
            memberships: {
              some: {
                endDate: {
                  lt: new Date(),
                },
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        totalStudents,
        activeMemberships: active,
        overdueMemberships: overdue,
      });
    }

    // 🚫 Unsupported route
    return res.status(404).json({ error: "Route not found" });
  } catch (err) {
    if (err.message === "Authentication required") {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (err.message === "Unauthorized") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    console.error("Unhandled Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
